## End-to-end workflows

### 1) Select folder and load files

1. User clicks the folder select button in `LoaderBar`.
2. Renderer `useSelectFolder` calls `workspace.selectFolder()`.
3. Main `workspace/selectFolder` opens directory picker, persists folder, scans files, and upserts file records.
4. Renderer then calls `workspace.listFiles(folder.id)` and maps DTOs to workspace models.
5. App state is updated with `currentFolder`, `files`, and reset `selectedFile`.

### 2) Select a file and initialize context

1. User clicks a file in `FileDisplayBar`.
2. Renderer sets `workspace.selectedFile`.
3. Renderer appends a system chat message (`Selected file: ...`) into `chat.messages`.
4. `AssessmentTab` and `ScoreTool` react to the selected file id.

### 3) Open document and capture selection

1. `AssessmentTab` passes `selectedFileId` to `OriginalTextView`/`TextViewWindow`.
2. `useTextViewDocument` calls `assessment.extractDocument({ fileId })`.
3. For `.docx`:
- base64 is decoded,
- OOXML text map is built,
- `docx-preview` renders content,
- render bridge maps DOM selection to anchor coordinates.
4. For `.pdf`, base64 is loaded for PDF rendering path.
5. User captures selection in `TextViewWindow`; `pendingSelection` is stored in local assessment-tab state.
6. `pendingSelection` is mirrored to global `ChatInterface` bindings.

### 4) Add/edit/delete/apply feedback comments

1. In comment mode, `ChatInterface` submit routes through assessment-tab chat actions.
2. If `pendingSelection` exists, inline feedback is created; otherwise block feedback is created.
3. `assessment/addFeedback` is called and feedback query is refetched.
4. `CommentsView` renders feedback list from query data.
5. Selecting a comment sets `activeCommentId` and can rehydrate pending selection.
6. Edit/delete/apply actions call respective assessment APIs and refetch feedback.

### 5) Send a comment to LLM

1. User triggers send-to-LLM from comment tools, optionally with a command id.
2. Renderer sets active comment/command state and calls `assessment/sendFeedbackToLlm`.
3. Main currently synthesizes a follow-up LLM feedback comment (stub behavior) and persists it.
4. Renderer refetches feedback and displays the new LLM comment.

### 6) Chat message round-trip (with streaming)

1. User selects a file; `ChatView` loads sessions with `llmSession/listByFile({ fileEntityUuid })`.
2. `ChatListScreen` shows temporary labels (`Chat 1`, `Chat 2`, ...) based on session list order.
3. User chooses a session in `ChatListScreen`; renderer loads turns via `llmSession/getTurns({ sessionId, fileEntityUuid })`.
4. User can delete a session from `ChatListScreen`; renderer calls `llmSession/delete({ sessionId })` and refreshes `listByFile`.
5. Main deletes from `llm_chat_sessions`; `llm_chat_session_turns` are removed by FK cascade.
6. User switches `ChatInterface` mode to chat and submits a message.
7. Renderer blocks chat send when no file is selected.
8. Renderer optimistically appends teacher + empty assistant messages, then calls `chat/sendMessage` with `fileId`, active `sessionId`, and `clientRequestId`.
9. Renderer includes `essay` only on the first send for a session id; subsequent sends in the same session omit `essay`.
10. Main validates LLM runtime readiness and sends request to orchestrator with `llm.chatStream`.
11. Python simple-chat builds a session-scoped system prompt from `essay` on first turn and reuses it for later turns in that session.
12. Stream chunks are emitted over `chat/streamChunk`; renderer appends chunk text to the assistant message.
13. While waiting for stream start, `ActionsView` shows "Loading LLM, please wait a moment"; after stream start (before content), `ChatScreen` shows `-----thinking-----` under the latest assistant bubble.
14. On first content chunk, thinking indicator is cleared; on completion, renderer marks chat status idle and finalizes assistant content.
15. Renderer writes optimistic send/stream messages with active `sessionId` into chat state and bumps a per-file session sync nonce.
16. `ChatView` refreshes `listByFile` ordering and `getTurns` for the active session, replacing that session transcript in state.
17. On session switch/new-chat, transient empty assistant draft messages for the previous session are cleared.
18. Main also persists teacher/assistant messages in `ChatRepository`.
19. If runtime is not ready, main returns `LLM_NOT_READY` and renderer surfaces the error.
20. `llmSession/clear` and `llmSession/delete` clear Python simple-chat session cache via `llm.simpleChat.clearSessionCache`.

### 7) Generate annotated feedback DOCX

1. Generate button in `CommentsView` is enabled only when selected file is `.docx` and at least one comment exists.
2. Renderer calls `assessment/generateFeedbackDocument({ fileId })`.
3. Main loads inline feedback, resolves source file path, and invokes `feedbackFileGenerator`.
4. Generator writes `<original>.annotated.docx` with Word comments, anchors, and summary section.
5. Renderer shows success toast with output path.

### 8) Rubric tab: list, select, create, clone, delete, edit

1. User switches `AssessmentWindow` to Rubric tab.
2. `useRubricListQuery` loads rubric list + last-used id.
3. Controller reconciles selected editing rubric from current selection/last-used/default first rubric.
4. User can create, clone, delete, and set last-used rubric via rubric mutations.
5. `RubricForReactPanel` loads matrix draft via `rubric/getMatrix`.
6. Edit commands dispatch `rubric/updateMatrix`, then invalidate matrix/list queries.

### 9) Score workflow (CommentsView -> Score tab)

1. User switches comments pane to Score tab.
2. `ScoreTool` loads rubric list, grading context (`rubric/getGradingContext`), rubric draft, and file scores (`rubric/getFileScores`).
3. Effective rubric is resolved from locked rubric, selected rubric, DB context, and fallback rules.
4. Selecting score cells triggers `rubric/saveFileScores`.
5. If rubric is locked and user requests rubric change, clear flow calls `rubric/clearAppliedRubric`, resets selection, and reloads context.

### 10) LLM manager lifecycle (Your LLM tab)

1. User switches `AssessmentWindow` to Your LLM tab (`LlmManager`).
2. Renderer loads catalog, downloaded models, active model, and runtime settings.
3. Download action calls `llmManager/downloadModel`; progress events stream over `llmManager/downloadProgress`.
4. Select action calls `llmManager/selectModel`, updates active model, and syncs runtime settings.
5. Delete action calls `llmManager/deleteDownloadedModel` and refreshes downloaded/active/settings queries.
6. Settings form calls `llmManager/updateSettings` and `llmManager/resetSettingsToDefaults`.

### 11) App shell orchestration

1. `AssessmentWindow` top tabs route between Assessment, Rubric, and Your LLM panels.
2. Chat panel can collapse/expand (`ChatView` <-> `ChatCollapsedRail`) via global UI state.
3. `AssessmentTab` publishes chat bindings (`pendingSelection`, `activeCommand`, `chatMode`, `draftText`) to global `ChatInterface` through `onChatBindingsChange`.
