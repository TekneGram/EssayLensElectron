# Phase 7 Report (Handoff for Phase 8)

## Purpose
Summarize what was achieved in Phase 7 (First Workflow - Happy Path), the current implementation state, and what context the next phase needs.

## Phase 7 Goal (From Checklist)
- Select folder -> persist cwd -> scan files -> populate file list.
- Click file -> render text in `OriginalTextView` (for `.docx`/`.pdf`) or show `ImageView`.
- Append system chat message in `ChatView`.

## What Was Achieved

### 1) Main-process workspace workflow is now functional for Round 1 happy path
The workspace IPC layer now performs real flow orchestration instead of stubs.

Updated files:
- `electron/main/ipc/workspaceHandlers.ts`
- `electron/main/services/fileScanner.ts`
- `electron/main/db/repositories/workspaceRepository.ts`

Implementation notes:
- `workspace/selectFolder` now:
  - opens folder dialog
  - persists selected cwd in repository
  - scans files recursively to max depth 2
  - persists scanned file records
  - returns typed folder DTO via `AppResult`
- `workspace/listFiles` now returns persisted files for a folder id.
- `workspace/getCurrentFolder` now returns persisted current folder.
- Picker cancel/no-path still returns `ok: true` with `folder: null` (safe no-op behavior retained).

### 2) Shared workspace contracts were expanded for typed file-list workflow
Workspace IPC contracts now include typed file list and current-folder result payloads.

Updated file:
- `electron/shared/workspaceContracts.ts`

Added contracts:
- `WorkspaceFileDto`
- `ListFilesResultData`
- `GetCurrentFolderResultData`

### 3) Preload API workspace typing was narrowed for new workflow
Renderer-facing API now has concrete typed results for list/get folder operations.

Updated file:
- `electron/preload/apiTypes.ts`

Implementation notes:
- `workspace.listFiles(folderId)` now returns `ApiResult<ListFilesResultData>`.
- `workspace.getCurrentFolder()` now returns `ApiResult<GetCurrentFolderResultData>`.

### 4) File-control async flow now runs select-folder + list-files and populates reducer state
The renderer mutation now executes the full folder-selection and file-list retrieval path.

Updated files:
- `renderer/src/features/file-control/hooks/useFileControl.ts`
- `renderer/src/features/file-control/FileControlContainer.tsx`
- `renderer/src/features/file-control/components/FileControl.tsx`
- `renderer/src/features/layout/components/FileDisplayBar.tsx`

Implementation notes:
- `useFileControl` mutation now:
  - sets workspace loading status on mutate
  - calls `workspace.selectFolder()`
  - handles picker cancel as no-op (`idle`, no error noise)
  - calls `workspace.listFiles(folderId)` on success
  - dispatches `workspace/setFiles` with mapped `WorkspaceFile[]`
  - preserves concise error + toast behavior on failures
- File list items are now buttons and dispatch selection on click.
- Selected file id is carried into `FileDisplayBar` and marked via `aria-current`.

### 5) Assessment view routing now responds to selected file kind
Assessment pane mode and views now switch based on clicked file type.

Updated file:
- `renderer/src/features/assessment-tab/components/AssessmentTab.tsx`

Implementation notes:
- Image file selection opens `ImageView` and 3-pane mode.
- `.docx`/`.pdf` selection keeps 2-pane mode and renders selected filename text in `OriginalTextView`.
- Added stable test ids for routing assertions.

### 6) System chat messages are appended and rendered on file selection
Selecting a file now writes a system message and `ChatView` renders chat history.

Updated files:
- `renderer/src/features/file-control/hooks/useFileControl.ts`
- `renderer/src/features/layout/components/ChatView.tsx`

Implementation notes:
- On file click, hook dispatches:
  - `workspace/setSelectedFile`
  - `chat/addMessage` with role `system` and file-specific content
- `ChatView` now renders message list when available.

### 7) Phase-7 tests were added/expanded
Added integration-style coverage for the first workflow and routing behavior.

Updated/new tests:
- `renderer/src/features/file-control/__tests__/FileControlContainer.test.tsx`
- `renderer/src/features/assessment-tab/__tests__/AssessmentTabRouting.test.tsx`
- `electron/main/ipc/__tests__/workspaceHandlers.test.ts`

Coverage includes:
- folder select success -> file listing persisted/returned and reducer updated
- folder picker cancel -> no folder/file regression, no list call
- file selection routing -> `ImageView` vs `OriginalTextView` behavior
- file selection -> system chat message appended and visible
- workspace IPC list/current-folder behavior after selection

## Current Validation Status
Verified during Phase 7 implementation:
- `npm run typecheck` passes.
- `npm run test` passes.
- Test suite currently green (renderer + electron) with new Phase 7 workflow coverage.

## Architectural Notes
- Query remains responsible for async workflow lifecycle; reducers remain canonical UI/session state store.
- Workspace contracts are now shared across main/preload/renderer for folder + file list flow.
- Current repository is in-memory for Round 1 behavior scaffolding; durable DB persistence is still deferred.
- File-kind normalization in renderer remains centralized through `fileKindFromExtension`.

## What Is Still Deferred (Expected)
- Python worker integration and action dispatch path (`llm.chat` / `llm.assessEssay`) is not implemented yet.
- Error mapping contract from Python worker (`PY_TIMEOUT`, `PY_PROCESS_DOWN`, etc.) is not implemented yet.
- Request/response correlation (`requestId`) for Python bridge is not implemented yet.
- File content extraction pipeline for real `.docx`/`.pdf` text is still placeholder-level in UI.

## Risks / Watchouts For Phase 8
1. Envelope consistency across process boundary
- Python integration should reuse existing `AppResult`/error-envelope style and avoid introducing parallel response shapes.

2. Error normalization drift
- Phase 8 must map worker/process failures to the planned canonical codes (`PY_TIMEOUT`, `PY_PROCESS_DOWN`, `PY_INVALID_RESPONSE`, `PY_ACTION_FAILED`).

3. Correlation safety
- Multi-request scenarios require strict `requestId` correlation to prevent cross-talk between concurrent requests.

4. Main-process boundary discipline
- Keep Python spawn/orchestration inside main process service layer; renderer should remain on typed `window.api` boundary.

## Suggested Start Point For Phase 8
1. Implement Python worker process management in Electron main (spawn, lifecycle, timeout handling).
2. Add one end-to-end test action path (`llm.chat` or `llm.assessEssay`) through IPC to Python and back.
3. Normalize all worker responses into shared success/error envelopes with mapped error codes.
4. Add tests for request correlation and failure mapping.
5. Keep `npm run typecheck` and `npm run test` green while introducing Python bridge.

## Phase Gate Manual Verification Commands (User Run)
1. `npm run dev`
2. `npm run build`
3. `npm run start:prod`
4. `npm run package` (or `npm run package:dir`)
