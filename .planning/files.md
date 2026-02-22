# File management advice for workspace vertical slice

## Context
Review vertical slice code for the workspace, particularly the management of files.
Expectation about file management:
1. User selects a folder.
2. System stores all file names in front end.
3. Allowed file types’ names and paths are stored in the database in the tables filepath, filename and image. Only names and paths are saved. File blobs are not saved. Scanned image data will be saved in image table later.
File path is absolute and is the directory of the folder the user selected.
If a file comes from a subfolder then the file path stub beyond the absolute directory is stored in append_path column so that the full path to the subfolder can be reconstructed later.
5, when a user opens the app, no folder is selected.
6. When the user selects a folder, the information about file paths and file names should be stored on the front end, but we need to check that the information is in the database.
7. If the information on the front end is not in the database, we add it.
8. If the information is in the database we don’t need to do anything other than acknowledge it is there.
9. If the user removed a file since they last used the app and the information is still in the database, this is stale information, but it does not mean that we delete the information because the user might add the file back in again later.
10. If the user has added new files since last time we update only those.

---


## 1) Should we always check existence before inserting?
**Yes in behavior, but do it with UPSERT semantics rather than app-side pre-check + insert.**

Why:
- Pre-check + insert is two round trips and race-prone.
- `INSERT ... ON CONFLICT DO NOTHING/UPDATE` is atomic and cheaper.

Pattern:
- For each scanned file, attempt UPSERT in `entities` and `filename`.
- If row already exists, no-op/update minimal fields.

## 2) Can we add multiple entries in parallel to SQLite?
**SQLite supports one writer at a time**, so true concurrent writes are not beneficial.

Best practice:
- One write transaction.
- Batched inserts/upserts using prepared statements.
- Optionally chunk very large batches.

This gives maximum throughput and consistency.

---

## Recommended algorithm (high level)

## Phase A — User selects folder
1. If user cancels: return `{ folder: null }`, no state change.
2. Normalize root path (absolute, resolved, no trailing separator).
3. Upsert into `filepath`.
4. Scan filesystem up to depth 2 for allowed extensions only.
5. Build frontend file list immediately from scan results.

## Phase B — Reconcile scan with DB (add missing only)
1. From scan results, derive tuples:
   - `filepath_uuid` = root absolute path
   - `append_path` = relative directory (null for root files)
   - `file_name`
   - `isImage` flag
2. Query DB once for existing tuples under `filepath_uuid`.
3. Build in-memory key set:
   - canonical key example: `append_path || ''` + `\u0000` + `file_name`
4. Partition scan results:
   - `existing`: key in set
   - `new`: key not in set
5. In one transaction:
   - Ensure `entities` rows for `new` file rows.
   - Insert `filename` for `new` rows only.
   - Insert `image` placeholder rows for `new` image types only.
6. Do **not** delete old DB rows not present in current scan.
7. Return summary (counts: scanned/existing/new/skipped).

## Phase C — Frontend state behavior
1. Always set `workspace.files` from fresh scan output for current session UX.
2. Optionally include stale DB rows in a separate diagnostics view, but not in primary file picker list unless file still exists.
3. Keep selected file reset after folder switch.

---

## Suggested SQL/index strategy for efficient reconciliation

## Add or confirm these constraints/indexes
1. `filepath.path` should be unique (or remain primary via `uuid` if same value).
2. In `filename`, add unique index:
   - `(filepath_uuid, append_path, file_name)`
3. Optional helper index:
   - `(filepath_uuid)` already exists and is good.
4. For image linkage, `image.entity_uuid` should be unique if one image row per file.

## Query pattern
- Fetch known keys for one folder:
  - `SELECT entity_uuid, append_path, file_name FROM filename WHERE filepath_uuid = ?`
- Batch insert new rows with transaction + conflict handling.

---

## Pseudocode (implementation-oriented)
Database requires uuid. uuid should be created by the frontend before entry into any database.
```text
function selectFolderAndSync():
  folder = openFolderDialog()
  if folder == null: return { folder: null, files: [] }

  root = normalizeAbsolute(folder)
  upsertFilepath(root)

  scanned = scanAllowedFiles(root, maxDepth=2)

  candidateRows = scanned.map(file => {
    rel = relative(root, file.absolutePath)
    appendPath = dirname(rel) == '.' ? null : dirname(rel)
    return {
      key: canonical(appendPath, basename(file.absolutePath)),
      fileName: basename(file.absolutePath),
      appendPath,
      absolutePath: file.absolutePath,
      kind: inferKind(file.absolutePath),
      isImage: kind in IMAGE_KINDS
    }
  })

  existing = listFilenameKeysByRoot(root)
  existingSet = Set(existing.map(r => canonical(r.append_path, r.file_name)))

  newRows = candidateRows.filter(r => !existingSet.has(r.key))

  beginTransaction()
  try:
    for row in newRows:
      entityId = deterministicEntityId(root, row.appendPath, row.fileName)
      upsertEntity(entityId, 'file')
      insertFilenameIfMissing(entityId, root, row.appendPath, row.fileName)
      if row.isImage:
        insertImageIfMissing(entityId)
    commit()
  catch:
    rollback()
    throw

  return {
    folder: toFolderDto(root),
    files: scanned.map(toWorkspaceDto),
    sync: {
      scannedCount: scanned.length,
      existingCount: candidateRows.length - newRows.length,
      insertedCount: newRows.length
    }
  }
```

---

## Boundary contracts useful for Codex context

These are the most useful contracts to have explicit before implementation.

## Renderer ↔ Preload (`window.api.workspace`)
1. `selectFolder(): Promise<AppResult<SelectFolderResponse>>`
2. `listFiles(folderId: string): Promise<AppResult<ListFilesResponse>>`
3. `getCurrentFolder(): Promise<AppResult<GetCurrentFolderResponse>>`
4. **Recommended new contract:**
   - `reconcileFiles(request): Promise<AppResult<ReconcileFilesResponse>>`

### Proposed `ReconcileFilesRequest`
```ts
{
  folderId: string; // absolute root
  scannedFiles: Array<{
    absolutePath: string;
    fileName: string;
    appendPath: string | null;
    kind: string;
  }>;
}
```

### Proposed `ReconcileFilesResponse`
```ts
{
  scannedCount: number;
  existingCount: number;
  insertedCount: number;
  imageInsertedCount: number;
}
```

## Preload ↔ Main IPC channels
- Existing:
  - `workspace/selectFolder`
  - `workspace/listFiles`
  - `workspace/getCurrentFolder`
- Recommended additions:
  - `workspace/reconcileFiles`
  - (optional) `workspace/listSyncStatus`

## Main handler ↔ Repository contracts
1. `setCurrentFolder(folderPath)`
2. `listFiles(folderId)`
3. `upsertFiles(folderId, files)`
4. **Recommended split for clarity:**
   - `listFilenameKeys(folderId)`
   - `insertMissingFiles(folderId, normalizedRows)`
   - `insertMissingImages(entityIds)`

## Repository ↔ SQLite contracts
- Must use transaction for batch insert/update.
- Must rely on unique constraints + conflict handling.
- Must return deterministic mapping to `WorkspaceFileDto`.

---

## Files likely needed for implementation

## Core implementation
- `electron/main/ipc/workspaceHandlers.ts`
- `electron/main/services/fileScanner.ts`
- `electron/main/db/repositories/workspaceRepository.ts`
- `electron/main/db/repositories/sqlHelpers.ts` (if deterministic entity helper changes)
- `electron/main/db/migrations/0001_core_entities.sql` (or new migration adding indexes/constraints)

## Shared/preload contracts
- `electron/shared/workspaceContracts.ts`
- `electron/preload/apiTypes.ts`
- `electron/preload/index.ts`

## Renderer orchestration
- `renderer/src/features/file-control/hooks/useFileControl.ts`
- `renderer/src/state/actions.ts`
- `renderer/src/state/reducers.ts`
- (optional UX) `renderer/src/features/layout/components/FileDisplayBar.tsx`

## Tests to update/add
- `electron/main/ipc/__tests__/workspaceHandlers.test.ts`
- `electron/main/db/__tests__/sqlite.test.ts`
- Add repository tests for reconciliation logic if not present.

---

## Important design notes
- Keep stale DB rows (do not delete on missing filesystem file).
- Keep frontend list current to actual filesystem scan for session UX.
- Use deterministic keying strategy to prevent duplicate inserts.
- Prefer one folder-scoped diff query + transaction over per-file query loops.
- SQLite "parallel" writes are effectively serialized; optimize with batched transactions, not concurrent writers.
