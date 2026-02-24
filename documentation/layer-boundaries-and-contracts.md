# EssayLens Layer Boundaries and Contracts

This document records the current explicit boundaries and contract surfaces between renderer, Electron preload/main, Python LLM worker, and SQLite.

## 1) Renderer (React/TanStack) -> Preload API boundary

**Boundary type:** `window.api` calls from renderer only (no direct Node/Electron calls).

- Bridge definition: `electron/preload/index.ts`
- Renderer types: `electron/preload/apiTypes.ts`
- Result envelope: `electron/shared/appResult.ts`
  - Success: `{ ok: true, data }`
  - Failure: `{ ok: false, error: { code, message, details? } }`

### Preload modules and contract files

- `workspace`
  - `selectFolder()`
  - `listFiles(folderId)`
  - `getCurrentFolder()`
  - Types: `electron/shared/workspaceContracts.ts`

- `assessment`
  - `extractDocument`, `listFeedback`, `addFeedback`, `editFeedback`, `deleteFeedback`, `applyFeedback`, `sendFeedbackToLlm`, `generateFeedbackDocument`, `requestLlmAssessment`
  - Types: `electron/shared/assessmentContracts.ts`

- `rubric`
  - `listRubrics`, `createRubric`, `cloneRubric`, `deleteRubric`, `getFileScores`, `saveFileScores`, `clearAppliedRubric`, `getGradingContext`, `getMatrix`, `updateMatrix`, `setLastUsed`
  - Types: `electron/shared/rubricContracts.ts`

- `chat`
  - `listMessages`, `sendMessage`, `onStreamChunk`
  - Types: `electron/shared/chatContracts.ts`

- `llmManager`
  - `listCatalogModels`, `listDownloadedModels`, `getActiveModel`, `downloadModel`, `deleteDownloadedModel`, `selectModel`, `getSettings`, `updateSettings`, `resetSettingsToDefaults`, `onDownloadProgress`
  - Types: `electron/shared/llmManagerContracts.ts`

## 2) Renderer internal contract boundaries

**Boundary type:** UI components -> hooks/services -> state reducers.

- Global reducer slices and actions:
  - Reducers: `renderer/src/state/reducers.ts`
  - Action unions: `renderer/src/state/actions.ts`
  - State shape: `renderer/src/state/types.ts`

### TanStack Query/Mutation boundaries (current)

- File control:
  - Mutation: `renderer/src/features/file-control/hooks/useFileControl.ts`

- Assessment:
  - Query key: `renderer/src/features/assessment-tab/hooks/queryKeys.ts`
  - Query: `useFeedbackListQuery.ts`
  - Mutations: `useAddFeedbackMutation.ts`, `useGenerateFeedbackDocumentMutation.ts`
  - API wrapper: `renderer/src/features/assessment-tab/hooks/feedbackApi.ts`

- Rubric:
  - Query keys: `renderer/src/features/rubric-tab/hooks/queryKeys.ts`
  - Queries: `useRubricListQuery.ts`, `useRubricDraftQuery.ts`
  - Mutations: `useRubricMutations.ts`
  - Extra queries/mutations in score flow: `renderer/src/features/assessment-tab/components/CommentsView/ScoreTool.tsx`
  - API wrapper: `renderer/src/features/rubric-tab/services/rubricApi.ts`

- LLM manager:
  - Query keys: `renderer/src/features/llm-manager/hooks/queryKeys.ts`
  - Queries: `useLlmCatalogQuery.ts`, `useDownloadedLlmModelsQuery.ts`, `useActiveLlmModelQuery.ts`, `useLlmSettingsQuery.ts`
  - Mutations: `useLlmManagerMutations.ts`
  - API wrapper: `renderer/src/features/llm-manager/services/llmManagerApi.ts`

### Chat boundary in renderer

- Chat send/stream orchestration is in `renderer/src/features/assessment-tab/components/AssessmentTab.tsx`.
- Chat UI view is in `renderer/src/features/layout/components/ChatView.tsx` and `ChatInterface.tsx`.
- Current chat messages rendered in `ChatView` come from reducer state, not directly from a query.

## 3) Preload -> Main IPC boundary

**Boundary type:** named IPC channels with typed request/response.

- Channel registration: `electron/main/ipc/registerHandlers.ts`

### Channels

- Workspace: `electron/main/ipc/workspaceHandlers.ts`
  - `workspace/selectFolder`
  - `workspace/listFiles`
  - `workspace/getCurrentFolder`

- Assessment: `electron/main/ipc/assessmentHandlers.ts`
  - `assessment/extractDocument`
  - `assessment/listFeedback`
  - `assessment/addFeedback`
  - `assessment/editFeedback`
  - `assessment/deleteFeedback`
  - `assessment/applyFeedback`
  - `assessment/sendFeedbackToLlm`
  - `assessment/generateFeedbackDocument`
  - `assessment/requestLlmAssessment` (currently returns not implemented)

- Rubric: `electron/main/ipc/rubricHandlers.ts`
  - `rubric/listRubrics`
  - `rubric/createRubric`
  - `rubric/cloneRubric`
  - `rubric/deleteRubric`
  - `rubric/getFileScores`
  - `rubric/saveFileScores`
  - `rubric/clearAppliedRubric`
  - `rubric/getGradingContext`
  - `rubric/getMatrix`
  - `rubric/updateMatrix`
  - `rubric/setLastUsed`

- Chat: `electron/main/ipc/chatHandlers.ts`
  - `chat/listMessages`
  - `chat/sendMessage`
  - Event: `chat/streamChunk`

- LLM manager: `electron/main/ipc/llmManagerHandlers.ts`
  - `llmManager/listCatalogModels`
  - `llmManager/listDownloadedModels`
  - `llmManager/getActiveModel`
  - `llmManager/downloadModel`
  - `llmManager/deleteDownloadedModel`
  - `llmManager/selectModel`
  - `llmManager/getSettings`
  - `llmManager/updateSettings`
  - `llmManager/resetSettingsToDefaults`
  - Event: `llmManager/downloadProgress`

## 4) Main handler -> Service/Repository boundaries

**Boundary type:** IPC handlers delegate to domain services/repositories.

- Workspace handler dependencies:
  - Repository: `electron/main/db/repositories/workspaceRepository.ts`
  - Service: `electron/main/services/fileScanner.ts`

- Assessment handler dependencies:
  - Repository: `electron/main/db/repositories/feedbackRepository.ts`
  - Workspace lookup: `workspaceRepository.ts`
  - Services: `documentExtractor.ts`, `feedbackFileGenerator.ts`

- Rubric handler dependencies:
  - Repository: `electron/main/db/repositories/rubricRepository.ts`

- Chat handler dependencies:
  - Repository: `electron/main/db/repositories/chatRepository.ts`
  - LLM orchestrator: `electron/main/services/llmOrchestrator.ts`
  - LLM settings/selection repositories
  - Runtime readiness checks: `llmRuntimeReadiness.ts`, `llmRuntimePaths.ts`

- LLM manager handler dependencies:
  - Repositories: `llmSelectionRepository.ts`, `llmSettingsRepository.ts`
  - Downloader service: `llmModelDownloader.ts`

## 5) Main -> Python LLM worker boundary

**Boundary type:** newline-delimited JSON over child process stdin/stdout.

- Client transport: `electron/main/services/pythonWorkerClient.ts`
- Orchestrator contract/mapping: `electron/main/services/llmOrchestrator.ts`
- Shared envelope types: `electron/shared/llmContracts.ts`

### Request/response contract

- Request envelope: `{ requestId, action, payload, timestamp }`
- Response envelope:
  - success: `{ requestId, ok: true, data, timestamp }`
  - failure: `{ requestId, ok: false, error, timestamp }`
- Stream event envelope:
  - `{ requestId, type: stream_start|stream_chunk|stream_done|stream_error, data, timestamp }`

### Electron-supported LLM actions

- `llm.chat`
- `llm.chatStream`
- `llm.assessEssay` (supported in orchestrator; not implemented in Python worker)
- `llm.generateFeedbackSummary` (supported in orchestrator; not implemented in Python worker)

### Python worker action dispatch

- Worker entrypoint: `electron-llm/main.py`
- Implemented action handlers:
  - `llm.chat` -> `_run_chat(...)`
  - `llm.chatStream` -> `_run_chat_stream(...)`
- Not implemented actions in worker:
  - `llm.assessEssay`
  - `llm.generateFeedbackSummary`

### Python task/service boundary

- Container wiring: `electron-llm/app/container.py`
- Runtime cache/lifecycle: `electron-llm/app/runtime_lifecycle.py`
- Service wrappers: `electron-llm/services/llm_service.py`
- Task service methods called by worker:
  - `LlmTaskService.prompt_tester_parallel(...)`
  - `LlmTaskService.prompt_tester_stream(...)`
  - File: `electron-llm/services/llm_task_service.py`

## 6) Main -> SQLite database boundary

**Boundary type:** repository classes issuing SQL against `SQLiteClient`.

- DB bootstrap/shared client:
  - `electron/main/db/sqlite.ts`
  - `electron/main/db/appDatabase.ts`

- Migrations dir:
  - `electron/main/db/migrations/*.sql`

### Repository contracts and touched tables

- `workspaceRepository.ts`
  - Reads/writes: `filepath`, `filename`, `entities`
  - Major operations: set/get current folder, upsert scanned files, resolve file by ID, list files

- `feedbackRepository.ts`
  - Reads/writes: `feedback`, `feedback_anchors`, `filename` (via helper), `filepath` (via helper), `entities` (via helper)
  - Major operations: list/get/add/edit/delete/apply feedback

- `chatRepository.ts`
  - Reads/writes: `chats`, `entities`
  - Major operations: list/add messages

- `rubricRepository.ts`
  - Reads/writes: `rubrics`, `rubric_details`, `rubric_scores`, `rubric_last_used`, `file_rubric_instances`, `file_rubric_scores`, `filepath_rubric_associations`, `filename`, `entities`
  - Major operations: list/create/clone/delete rubric, matrix read/update, grading context, save/clear file rubric scores

- `llmSettingsRepository.ts`
  - Reads/writes: `llm_settings`

- `llmSelectionRepository.ts`
  - Reads/writes: `llm_selection_defaults`, `llm_selection`, `llm_settings`

- SQL helper boundary: `sqlHelpers.ts`
  - `ensureEntity`, `ensureFileRecord`, `ensureGlobalChatEntity`

### UUID ownership boundary

- UUIDs are generated in Electron repository/handler layer (`randomUUID` in repositories and some handlers), consistent with project rule.

## 7) Filesystem/network external boundaries

- Folder pick dialog boundary: `workspace/selectFolder` handler uses Electron dialog.
- Workspace scanning boundary: `fileScanner.ts` scans recursively to depth 2.
- Document IO boundary:
  - `documentExtractor.ts` reads docx/pdf bytes and returns base64 payloads.
  - `feedbackFileGenerator.ts` reads/writes `.docx` zip/xml and emits `.annotated.docx`.
- Model download network boundary:
  - `llmModelDownloader.ts` performs HTTPS download from Hugging Face and writes to userData models directory.

## 8) Current contract gaps to track

- `assessment/requestLlmAssessment` IPC exists but currently returns not implemented.
- Python worker returns "Action not implemented yet" for `llm.assessEssay` and `llm.generateFeedbackSummary`.
- `documentExtractor.ts` currently does not extract plain text content; it returns base64 document data for docx/pdf.
