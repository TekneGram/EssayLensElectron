## 1) Main/preload contracts

### 1.1 Result envelope

Every IPC response uses `AppResult<T>` from `electron/shared/appResult.ts`:
- Success: `{ ok: true, data: T }`
- Failure: `{ ok: false, error: { code, message, details? } }`

Preload returns `AppResult` values as-is; renderer application/hook layers typically throw on `ok: false`.

### 1.2 Exposed preload API (`window.api`)

Defined in `electron/preload/index.ts` + `electron/preload/apiTypes.ts`.

- `workspace`
- `selectFolder()`
- `listFiles(folderId: string)`
- `getCurrentFolder()`

- `assessment`
- `extractDocument({ fileId })`
- `listFeedback({ fileId })`
- `addFeedback(request)`
- `editFeedback({ feedbackId, commentText })`
- `deleteFeedback({ feedbackId })`
- `applyFeedback({ feedbackId, applied })`
- `sendFeedbackToLlm({ feedbackId, command? })`
- `generateFeedbackDocument({ fileId })`
- `requestLlmAssessment({ fileId, instruction? })`

- `rubric`
- `listRubrics()`
- `createRubric({ name? })`
- `cloneRubric({ rubricId })`
- `deleteRubric({ rubricId })`
- `getFileScores({ fileId, rubricId })`
- `saveFileScores({ fileId, rubricId, selections })`
- `clearAppliedRubric({ fileId, rubricId })`
- `getGradingContext({ fileId })`
- `getMatrix({ rubricId })`
- `updateMatrix({ rubricId, operation })`
- `setLastUsed({ rubricId })`

- `chat`
- `listMessages(fileId?: string)`
- `sendMessage({ fileId?, message, contextText?, clientRequestId?, sessionId? })`
- `onStreamChunk(listener)` subscribes to streamed chat events (`chat/streamChunk`)

- `llmManager`
- `listCatalogModels()`
- `listDownloadedModels()`
- `getActiveModel()`
- `downloadModel({ key })`
- `deleteDownloadedModel({ key, deleteFiles? })`
- `onDownloadProgress(listener)` subscribes to download events (`llmManager/downloadProgress`)
- `selectModel({ key })`
- `getSettings()`
- `updateSettings({ settings })`
- `resetSettingsToDefaults()`

- `llmServer`
- `start()`
- `stop()`
- `status()`

- `llmSession`
- `create({ sessionId, fileEntityUuid })`
- `getTurns({ sessionId, fileEntityUuid })`
- `listByFile({ fileEntityUuid })`
- `clear({ sessionId })`

### 1.3 IPC channels

Registered by `electron/main/ipc/registerHandlers.ts`.

- Workspace: `workspace/selectFolder`, `workspace/listFiles`, `workspace/getCurrentFolder`
- Assessment: `assessment/extractDocument`, `assessment/listFeedback`, `assessment/addFeedback`, `assessment/editFeedback`, `assessment/deleteFeedback`, `assessment/applyFeedback`, `assessment/sendFeedbackToLlm`, `assessment/generateFeedbackDocument`, `assessment/requestLlmAssessment`
- Rubric: `rubric/listRubrics`, `rubric/createRubric`, `rubric/cloneRubric`, `rubric/deleteRubric`, `rubric/getFileScores`, `rubric/saveFileScores`, `rubric/clearAppliedRubric`, `rubric/getGradingContext`, `rubric/getMatrix`, `rubric/updateMatrix`, `rubric/setLastUsed`
- Chat: `chat/listMessages`, `chat/sendMessage`
- LLM manager: `llmManager/listCatalogModels`, `llmManager/listDownloadedModels`, `llmManager/getActiveModel`, `llmManager/downloadModel`, `llmManager/deleteDownloadedModel`, `llmManager/selectModel`, `llmManager/getSettings`, `llmManager/updateSettings`, `llmManager/resetSettingsToDefaults`
- LLM server: `llmServer/start`, `llmServer/stop`, `llmServer/status`
- LLM session: `llmSession/create`, `llmSession/getTurns`, `llmSession/listByFile`, `llmSession/clear`

Event channels sent from main to renderer:
- Chat stream: `chat/streamChunk`
- LLM download progress: `llmManager/downloadProgress`

## 2) Main process behavior

### 2.1 App bootstrap

- Entry: `electron/main/index.ts`
- `createMainApp().start()` registers IPC handlers once via `registerIpcHandlers(ipcMain)` and starts Electron lifecycle wiring.
- Creates BrowserWindow with:
- `contextIsolation: true`
- `sandbox: true`
- `nodeIntegration: false`
- `preload: <...>/preload/index.js`
- Window size defaults: `1440x900` (`minWidth: 1024`, `minHeight: 700`)
- Loads Vite dev URL when present, otherwise built `renderer/dist/index.html`.
- Standard lifecycle wiring is in place: quit on non-macOS `window-all-closed`, recreate window on macOS `activate`.

### 2.2 Workspace flow (`workspaceHandlers.ts`)

- `selectFolder` opens directory picker, persists folder in `WorkspaceRepository`, scans files recursively (depth 2), upserts file records, and returns selected folder.
- `listFiles` returns files by `folderId`.
- `getCurrentFolder` returns last selected folder.
- Persisted file IDs are repository UUIDs (`filename.entity_uuid`) and folder IDs are UUIDs (`filepath.uuid`).
- Workspace persistence is SQLite-backed (`filepath`, `filename`, `entities`) with repository-side path resolution for `resolveFileById`.
- Scanner/handler accept common document/image extensions and filter unknown file kinds.

### 2.3 Assessment flow (`assessmentHandlers.ts`)

- Strict payload normalization/validation for every handler.
- `extractDocument` returns `{ fileId, text, extractedAt, format, fileName, dataBase64? }`.
- Current extractor (`documentExtractor.ts`) returns base64 payload for `.docx` and `.pdf`, empty `text`, and format `other` for unsupported files.
- `listFeedback`/`addFeedback`/`editFeedback`/`deleteFeedback`/`applyFeedback` map to `FeedbackRepository`.
- Inline feedback enforces required quote + prefix/suffix + start/end anchors.
- `sendFeedbackToLlm` currently creates a synthetic LLM follow-up feedback item based on existing feedback (same kind/anchors for inline comments).
- `generateFeedbackDocument`:
- Loads inline feedback for file.
- Generates `<source>.annotated.docx` via `feedbackFileGenerator.ts`.
- Inserts Word comments + range markers using anchors.
- Appends feedback summary paragraphs at the end of the generated doc.
- Generation supports `.docx` source files only (service enforces this).
- `requestLlmAssessment` currently returns not implemented.

### 2.4 Rubric flow (`rubricHandlers.ts`)

- Handlers validate payloads and route to `RubricRepository` for list/create/clone/delete/get/update operations.
- Supports rubric matrix workflows (`listRubrics`, `getMatrix`, `updateMatrix`) plus last-used rubric (`setLastUsed`).
- Supports file scoring workflows (`getGradingContext`, `getFileScores`, `saveFileScores`, `clearAppliedRubric`).
- Enforces domain constraints through error mapping (`RUBRIC_NOT_FOUND`, `RUBRIC_ACTIVE`, `RUBRIC_IN_USE`, `RUBRIC_ARCHIVED`, `RUBRIC_INACTIVE`).

### 2.5 Chat flow (`chatHandlers.ts`)

- `sendMessage` normalizes request (supports legacy `content` fallback), loads runtime settings, and validates LLM readiness before calling Python.
- Session context is persisted in SQLite using `LlmChatSessionRepository` (`llm_chat_sessions` + `llm_chat_session_turns`).
- `sendMessage` resolves `sessionId` from request (`sessionId` or fallback `file:<fileId>`), loads recent turns, and passes them to Python in `sessionTurns`.
- When streaming is available, it uses `llm.chatStream` and emits `chat/streamChunk` events (`start`/`chunk`/`done`/`error`) back to renderer; otherwise it falls back to `llm.chat`.
- On success it persists both teacher and assistant UI messages in `ChatRepository`, appends turn-pairs to `LlmChatSessionRepository`, and returns `reply`.
- `listMessages` returns all messages or file-scoped messages.
- If runtime prerequisites are missing, it returns `LLM_NOT_READY` with actionable detail payload.

### 2.6 Python bridge (`llmOrchestrator.ts`, `pythonWorkerClient.ts`)

- Spawns a Python worker process and communicates via newline-delimited JSON over stdio.
- Runtime command selection:
- Dev/default: `python3 -u electron-llm/main.py`
- With env override: `PYTHON_EXECUTABLE` and/or `PYTHON_WORKER_PATH`
- Packaged app without override: bundled worker executable under `resources/python-worker/<platform-arch>/...`
- Sends newline-delimited JSON requests over stdin.
- Parses newline-delimited JSON responses from stdout.
- Python worker entrypoint (`electron-llm/main.py`) now routes chat actions to the simple pipeline module (`electron-llm/app/pipeline_simple.py`) instead of keeping simple-chat logic inline.
- Enforces timeout and requestId matching.
- Supports stream event envelopes (`stream_start`, `stream_chunk`, `stream_done`, `stream_error`) for chat streaming.
- Supported actions: `llm.assessEssay`, `llm.chat`, `llm.chatStream`, `llm.generateFeedbackSummary`, `llm.evaluate.simple`, `llm.evaluate.withRubric`, `llm.evaluate.bulk`, `llm.session.create` (deprecated), `llm.session.clear` (deprecated), `llm.server.start`, `llm.server.stop`, `llm.server.status`.
- Error mapping: `PY_TIMEOUT`, `PY_PROCESS_DOWN`, `PY_INVALID_RESPONSE`, `PY_ACTION_FAILED`.

### 2.7 LLM manager flow (`llmManagerHandlers.ts`)

- Handles catalog listing, downloaded-model lifecycle, active-model selection, runtime settings read/update/reset, and download orchestration.
- `downloadModel` streams progress events on `llmManager/downloadProgress` and persists downloaded metadata in `llm_selection`.
- `selectModel` marks exactly one active model and applies default runtime settings (including gguf/mmproj paths).
- `listDownloadedModels`/`getActiveModel` reconcile stale records by removing entries whose files no longer exist.
- `deleteDownloadedModel` can remove files from disk and clears runtime model paths when deleting the active model.

### 2.8 Persistence layer reality check

- Repositories under `electron/main/db/repositories` are SQLite-backed through `SQLiteClient` + migrations (not in-memory maps/arrays).
- DB path resolution:
- Tests (`VITEST`): `:memory:`
- Runtime: `<electron userData>/essaylens.sqlite3` (fallback to `process.cwd()/essaylens.sqlite3`)
- Migrations auto-apply from `electron/main/db/migrations` (or packaged resources path), tracked in `_migrations`.
- SQLite initialization enables `PRAGMA foreign_keys = ON` and `PRAGMA journal_mode = WAL`.

## 3) File structure
```text
electron/
  main/
    index.ts
    __tests__/
    ipc/
      registerHandlers.ts
      result.ts
      types.ts
      workspaceHandlers.ts
      assessmentHandlers.ts
      chatHandlers.ts
      rubricHandlers.ts
      llmManagerHandlers.ts
      __tests__/
    services/
      fileScanner.ts
      documentExtractor.ts
      feedbackFileGenerator.ts
      pythonWorkerClient.ts
      llmOrchestrator.ts
      llmModelDownloader.ts
      llmRuntimePaths.ts
      llmRuntimeReadiness.ts
      __tests__/
    db/
      appDatabase.ts
      sqlite.ts
      __tests__/
      migrations/
      seeds/
      repositories/
        sqlHelpers.ts
        workspaceRepository.ts
        feedbackRepository.ts
        chatRepository.ts
        rubricRepository.ts
        llmSettingsRepository.ts
        llmSelectionRepository.ts
        __tests__/
  preload/
    index.ts
    apiTypes.ts
    __tests__/
  shared/
    appResult.ts
    workspaceContracts.ts
    assessmentContracts.ts
    chatContracts.ts
    rubricContracts.ts
    llmContracts.ts
    llmManagerContracts.ts
    __tests__/
```
