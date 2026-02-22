# EssayLens
Read what this app is about before implementing anything.
Then follow the instructions to implement the relevant phase.

## What is EssayLens tech stack?
- This app is an electron app.
- Electron will handle the database.
- Tanstack will manage state in the front end.
- React with vite will provide the UI and component states
- Python is spawned in the backend to handle all LLM interactions. Python does not need to touch the database
- TypeScript is used everywhere in electron.

## Product Description
- This is a product for teachers to grade second language essays, focusing particularly on English.
- The teacher can select a folder on their own system which will contain student writing in either .docx or .pdf files. However, images can also be handled using OCR models and multi-modal projections.
- The teacher can select a file, displayed in the UI, and the students' writing will be rendered into the UI.
- The teacher can add block comments to the student's writing.
- The teacher can highlight certain parts of the file and add inline comments to the student's writing.
- The teacher can select a rubric from a list of rubrics and apply it to a project
- The teacher can design and create a rubric.
- The teacher can give an essay a score through the rubric.
- The teacher can send the essay to the LLM for block feedback.
- The teacher can send extracts of the essay to the LLM for inline feedback.
- The teacher can generate a feedback document which contains the student's original writing and both the inline and block comments, saved to disk.

## App workflow
1. The teacher selects the folder in the FileControl area - this updates the database filepath table.
2. When the teacher selects the folder, an algorithm loops through folders recursively down to two layers, looking for .docx, .pdf and image
  files and updates the filename table and if its an image, the image table, too. This allows us to display the file names in the
  FileDisplayBar. The ChatViewer displays a message e.g. "Great! We're now working in the folder" + folder name, and this updates the chat
  table. (not a real chat with an LLM, but simulating one)
3. Teacher can click on a filename in the FileDisplayBar. This opens up the document, gets the text out of it and renders it to the
  OriginalTextView. Nothing is updated on the database here. The chat displays some information about the text (e.g., "Are you ready to assess this essay? Let's do it!") and this updates the chat table in the database and ChatViewer. 
4. The teacher adds some feedback to the essay using the ChatInterface (with a specific feedback command). This is sent to the database and
  updates the feedback table. The CommentsView is also updated with the comment. (There are two types of comment, inline and block, but that is not important right now).
5. The teacher uses the ChatInterface to request an LLM assessment. The LLM returns some feedback, which is updated in the feedback table in
  the database, and the CommentsView is updated with the LLM comment. The ChatViewer also displays "comments added", updating the chat table in the database.
6. The teacher selects the RubricTab. This pulls in the rubric information from the rubrics table in the database.
7. The teacher selects one of the rubrics and this brings in information from rubric_details and rubric_scores which are combined in the
  front end to create the rubric layout.
8. The teacher edits the rubric by adding a new category and an extra score level. This is updated in the rubric_details and rubric_scores
  tables in the database. The chat notifies the user of the update, thus updating the chat table.
9. The teacher decides to chat with the LLM through the ChatInterface about the essay and get advice. The essay is sent to the LLM with the
  teacher's question. The LLM gives feedback, and this updates the ChatViewer with the information, as well as the chat table in the database.
10. The teacher selects the ScoreTool in the CommentsView which reveals the rubric in a ready-to-grade form. The teacher selects some cells
  from the rubric, thereby applying a score. This information updates the database tables file_rubric_instances and file_rubric_scores. The
  chat is also updated.
11. The teacher clicks to generate the feedback file in the OriginalTextView or through the ChatInterface. The feedback table and
  file_rubric_instances and file_rubric_scores tables are accessed and used to update the student's document, creating a new word document that is output to the folder specified by the information from filepath and filename tables.

----------------------Technical Specifications----------------------

- When generating uuid numbers for database entry, do so in the electron repositories files.


# EssayLens Electron App Guide (for Codex agents)

This document describes the current implementation in `electron/` and `renderer/`, with emphasis on process contracts, UI/layout contracts, styling rules, component hierarchy, and end-to-end workflows.

## 1) High-level architecture

- Runtime model: Electron desktop app with isolated renderer.
- Main process: `electron/main` registers all IPC handlers and owns service/repository orchestration.
- Preload bridge: `electron/preload/index.ts` exposes `window.api` with typed modules (`workspace`, `assessment`, `rubric`, `chat`).
- Shared contracts: `electron/shared/*Contracts.ts` and `electron/shared/appResult.ts` define request/response payloads and result envelopes used on both sides.
- Renderer app: React + local reducer state + React Query for async fetching/mutations.

## 2) Folder structure

```text
electron/
  main/
    index.ts
    ipc/
      registerHandlers.ts
      workspaceHandlers.ts
      assessmentHandlers.ts
      chatHandlers.ts
      rubricHandlers.ts
    services/
      fileScanner.ts
      documentExtractor.ts
      feedbackFileGenerator.ts
      pythonWorkerClient.ts
      llmOrchestrator.ts
    db/
      sqlite.ts
      migrations/
      repositories/
        workspaceRepository.ts
        feedbackRepository.ts
        chatRepository.ts
        rubricRepository.ts
  preload/
    index.ts
    apiTypes.ts
  shared/
    appResult.ts
    workspaceContracts.ts
    assessmentContracts.ts
    chatContracts.ts
    llmContracts.ts

renderer/
  src/
    main.tsx
    App.tsx
    app/
      AppProviders.tsx
      queryClient.ts
    state/
      AppStateProvider.tsx
      initialState.ts
      reducers.ts
      selectors.ts
      actions.ts
    types/
      primitives.ts
      models.ts
      state.ts
      commands.ts
    features/
      file-control/
      assessment-window/
      assessment-tab/
      layout/
      rubric-tab/
    styles/
      tokens.css
      themes.css
      base.css
      layout.css
      components.css
```

## 3) Main/preload contracts

### 3.1 Result envelope

Every IPC response uses `AppResult<T>` from `electron/shared/appResult.ts`:
- Success: `{ ok: true, data: T }`
- Failure: `{ ok: false, error: { code, message, details? } }`

Renderer-side API wrappers usually throw `Error(result.error.message)` on `ok: false`.

### 3.2 Exposed preload API (`window.api`)

Defined in `electron/preload/index.ts` + `electron/preload/apiTypes.ts`.

- `workspace`
- `selectFolder()`
- `listFiles(folderId)`
- `getCurrentFolder()`

- `assessment`
- `extractDocument({ fileId })`
- `listFeedback({ fileId })`
- `addFeedback(...)`
- `editFeedback({ feedbackId, commentText })`
- `deleteFeedback({ feedbackId })`
- `applyFeedback({ feedbackId, applied })`
- `sendFeedbackToLlm({ feedbackId, command? })`
- `generateFeedbackDocument({ fileId })`
- `requestLlmAssessment({ fileId, instruction? })`

- `rubric`
- `listRubrics()`
- `getMatrix({ rubricId })`
- `updateMatrix(request)`

- `chat`
- `listMessages({ fileId? })`
- `sendMessage({ fileId?, message, contextText? })`

### 3.3 IPC channels

Registered by `electron/main/ipc/registerHandlers.ts`.

- Workspace: `workspace/selectFolder`, `workspace/listFiles`, `workspace/getCurrentFolder`
- Assessment: `assessment/extractDocument`, `assessment/listFeedback`, `assessment/addFeedback`, `assessment/editFeedback`, `assessment/deleteFeedback`, `assessment/applyFeedback`, `assessment/sendFeedbackToLlm`, `assessment/generateFeedbackDocument`, `assessment/requestLlmAssessment`
- Rubric: `rubric/listRubrics`, `rubric/getMatrix`, `rubric/updateMatrix`
- Chat: `chat/listMessages`, `chat/sendMessage`

## 4) Main process behavior

### 4.1 App bootstrap

- Entry: `electron/main/index.ts`
- Creates BrowserWindow with:
- `contextIsolation: true`
- `sandbox: true`
- `nodeIntegration: false`
- Loads Vite dev URL when present, otherwise built `renderer/dist/index.html`.

### 4.2 Workspace flow (`workspaceHandlers.ts`)

- `selectFolder` opens directory picker, persists folder in `WorkspaceRepository`, scans files recursively (depth 2), upserts files, returns selected folder.
- `listFiles` returns files by `folderId`.
- `getCurrentFolder` returns last selected folder.
- File IDs are currently absolute file paths.
- File kind is inferred from extension; unknown types map to `unknown`.

### 4.3 Assessment flow (`assessmentHandlers.ts`)

- Strict payload normalization/validation for every handler.
- `extractDocument` returns `{ fileId, text, extractedAt, format, fileName, dataBase64? }`.
- Current extractor (`documentExtractor.ts`) returns base64 for `.docx` and `.pdf`, empty `text`.
- `listFeedback`/`addFeedback`/`editFeedback`/`deleteFeedback`/`applyFeedback` map to `FeedbackRepository`.
- Inline feedback enforces required quote + prefix/suffix + start/end anchors.
- `sendFeedbackToLlm` currently creates a new synthetic LLM feedback item based on existing feedback.
- `generateFeedbackDocument`:
- Loads inline feedback for file.
- Generates `<source>.annotated.docx` via `feedbackFileGenerator.ts`.
- Inserts Word comments + range markers using anchors.
- Appends summary paragraphs at end of document.
- `requestLlmAssessment` currently returns not implemented.

### 4.4 Chat flow (`chatHandlers.ts`)

- `sendMessage` normalizes request (supports legacy `content` fallback for message), calls `LlmOrchestrator` action `llm.chat`, persists teacher and assistant messages in `ChatRepository`, returns `reply`.
- `listMessages` returns all messages or file-scoped messages.

### 4.5 Python bridge (`llmOrchestrator.ts`, `pythonWorkerClient.ts`)

- Spawns Python worker (`python -u <worker.py>`).
- Sends newline-delimited JSON requests over stdin.
- Parses newline-delimited JSON responses from stdout.
- Enforces timeout and requestId matching.
- Supported actions: `llm.assessEssay`, `llm.chat`, `llm.generateFeedbackSummary`.
- Error mapping: `PY_TIMEOUT`, `PY_PROCESS_DOWN`, `PY_INVALID_RESPONSE`, `PY_ACTION_FAILED`.

### 4.6 Repository reality check

Current repositories in `electron/main/db/repositories/*.ts` are in-memory maps/arrays, not persistent DB-backed implementations yet.

## 5) Renderer composition and state

### 5.1 App root and providers

- `renderer/src/main.tsx` loads CSS in order: `tokens` -> `themes` -> `base` -> `layout` -> `components`.
- Default theme: `data-theme="system"`.
- `AppProviders` wraps app with `QueryClientProvider`, `AppStateProvider`, and `ToastContainer`.
- Query defaults: retries disabled (`renderer/src/app/queryClient.ts`).

### 5.2 Global state slices

State shape: `workspace`, `chat`, `feedback`, `rubric`, `ui`.

- Workspace: current folder, file list, selected file, extracted text map.
- Chat: messages, draft, send status/error.
- Feedback: `byFileId`, status/error.
- Rubric: list, selected rubric, matrix, status/error.
- UI: top tab, comments tab, theme, chat collapsed flag, assessment split ratio.

Reducer notes:
- Split ratio is clamped between `0.35` and `0.8`.
- Selected file type is derived from `workspace.files` extension kind.

## 6) Component hierarchy

Top-level tree from `renderer/src/App.tsx`:

```text
App
  FileControlContainer
    FileControl
      LoaderBar
      FileDisplayBar

  AssessmentWindow
    (tab: assessment) AssessmentTab
      [optional] ImageView
      OriginalTextView
        ProcessCommandCenter
        TextViewWindow
      [two-pane only] assessment splitter
      CommentsView
        CommentView[]
          CommentHeader
          CommentBody
          CommentTools

    (tab: rubric) RubricTab
      RubricSelectionView (stub)
      RubricView (stub)

  ChatView OR ChatCollapsedRail
  ChatInterface
    CommandDisplay
    HighlightedTextDisplay
    ChatInput
    CommandDropdown
    ChatToggle
    Send button
```

Important orchestration contract:
- `AssessmentTab` owns `activeCommand`, `pendingSelection`, `chatMode`, `draftText`.
- It exports these handlers/state to bottom `ChatInterface` through `onChatBindingsChange`.
- So `ChatInterface` is globally rendered, but functionally driven by `AssessmentTab` state.

## 7) Layout and style contracts

### 7.1 CSS architecture

- Tokens: `renderer/src/styles/tokens.css`
- Theme variables: `renderer/src/styles/themes.css` (`light`, `dark`, `system`)
- Base resets/background/type: `renderer/src/styles/base.css`
- Grid layout: `renderer/src/styles/layout.css`
- Component visuals: `renderer/src/styles/components.css`

### 7.2 App layout grid

Desktop (`.app-shell`):
- Rows: main content + bottom chat input bar (`72px`).
- Columns: loader rail (`46px`), file bar (`170px`), assessment area (`flex`), chat panel (`320px`).
- Chat collapse sets last column to `8px` and swaps `ChatView` with `ChatCollapsedRail`.

Mobile (`max-width: 900px`):
- Single-column stack: assessment -> chat view -> chat input.
- Loader/file rails hidden.
- Assessment/rubric panes collapse to one column.

### 7.3 Assessment pane layout

- Two-pane mode (docx/pdf/other): left text pane + draggable vertical splitter + comments pane.
- Three-pane mode (image): image pane + text pane + comments pane.
- Split ratio variable: `--assessment-left-ratio` from state.

### 7.4 Styling conventions to preserve

- Core classes: `pane`, `subpane`, `content-block`, `tab`, `chat-send`, `chat-toggle`, `comment-view`.
- Color semantics derive from CSS vars, not hard-coded values.
- Accessibility patterns in use:
- ARIA roles for tabs/panels.
- `aria-selected`/`aria-controls` for tab buttons.
- Keyboard support for splitter arrows and comment card Enter/Space activation.

## 8) End-to-end workflows

### 8.1 Select folder and files

1. User clicks `LoaderBar` select button.
2. Renderer `useFileControl` calls `window.api.workspace.selectFolder()`.
3. Main opens folder picker, scans files, upserts repository.
4. Renderer calls `listFiles(folderId)` and writes file list into workspace state.
5. User clicks file in `FileDisplayBar`; state updates selected file and injects a system chat message.

### 8.2 Open text and capture selection

1. `AssessmentTab` passes selected file id to `OriginalTextView`.
2. `useTextViewDocument` calls `assessment.extractDocument`.
3. For docx:
- Decodes base64.
- Builds text map from OOXML runs/paragraphs.
- Renders with `docx-preview`.
- Builds DOM<->OOXML `RenderBridge`.
4. User selects text in `TextViewWindow`.
5. `useTextViewSelection` maps browser selection to anchor pair + quote + context.
6. `pendingSelection` is set and mirrored into global `ChatInterface` preview.

### 8.3 Add/edit/delete/apply feedback

1. In comment mode, submit from `ChatInterface`.
2. If `pendingSelection` exists -> add inline feedback; else add block feedback.
3. `useAddFeedbackMutation` calls IPC, updates state, invalidates feedback query.
4. Comments render in `CommentsView`.
5. Inline comment click sets `activeCommentId` and resets selection context.
6. Edit/delete/apply actions call respective APIs, then refetch list.

### 8.4 Send feedback to LLM

1. User triggers send-to-LLM on a comment, optionally with command.
2. Renderer sets active command and chat lock state.
3. Main handler currently synthesizes an LLM follow-up feedback item and saves it.
4. Feedback list is refetched; new LLM comment appears.

### 8.5 Chat message round-trip

1. User switches mode to chat (or mode auto-locks when a command is active).
2. Submit calls `chat/sendMessage` with message + optional `fileId` and `contextText`.
3. Main calls Python worker through `LlmOrchestrator`.
4. On success, main persists teacher + assistant messages and returns reply.
5. Renderer appends messages to `chat.messages`; `ChatView` renders log.

### 8.6 Generate annotated feedback DOCX

1. User clicks Generate in `CommentsView` (enabled only for `docx` + at least one comment).
2. Renderer calls `assessment/generateFeedbackDocument`.
3. Main filters inline feedback, runs `feedbackFileGenerator`.
4. Generator writes `<original>.annotated.docx` and returns output path.
5. Renderer shows toast with generated file path.

## 9) Current stubs and known implementation limits

- Rubric IPC handlers return not implemented.
- Rubric renderer tab is placeholder UI.
- `requestLlmAssessment` is not implemented.
- Document extractor returns base64 payloads but not extracted plain text.
- State is ephemeral in memory because repositories are in-memory.

## 10) Change safety checklist for agents

- Keep IPC contracts aligned with shared types in `electron/shared/*Contracts.ts`.
- Preserve `AppResult` envelope for every preload/main call.
- Do not bypass preload; renderer should call `window.api` only.
- When editing selection/anchor logic, keep `RenderBridge` and feedback anchor schema consistent.
- Preserve split-ratio clamping and keyboard resizing behavior.
- Preserve tab ARIA semantics and chat-collapse layout behavior.
- If adding persistence, implement repositories behind current interfaces so handlers and renderer contracts remain stable.

## Database Schema
# Database plan for EssayLens
Database is sqlite3.
Database is accessed through electron's IPC.
Only electron is allowed to touch the database

## Table entities
```sql
CREATE TABLE entities (
    uuid TEXT PRIMARY KEY,
    type TEXT CHECK (type IN ('file', 'rubric')),
    created_at TEXT NOT NULL
);
```

## Table: filepath

```sql
CREATE TABLE filepath (
    uuid TEXT PRIMARY KEY,
    path TEXT NOT NULL,
    created_at TEXT NOT NULL
);
```
---
## Table: filename
```sql
CREATE TABLE filename (
    entity_uuid TEXT PRIMARY KEY,
    filepath_uuid TEXT NOT NULL,
    append_path TEXT,
    file_name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    checked_is_generated INTEGER NOT NULL DEFAULT 0 CHECK (checked_is_generated IN (0,1)),
    generated_at TEXT,
    FOREIGN KEY (entity_uuid) REFERENCES entities (uuid),
    FOREIGN KEY (filepath_uuid) REFERENCES filepath (uuid)
);
```
---
## Table: image
```sql
CREATE TABLE image (
    entity_uuid TEXT NOT NULL,
    to_text INTEGER NOT NULL DEFAULT 0 CHECK (to_text IN (0,1)),
    text TEXT,
    FOREIGN KEY (entity_uuid) REFERENCES filename (entity_uuid)
);
```
---
## Table: feedback
```sql
CREATE TABLE feedback (
    uuid TEXT PRIMARY KEY,
    entity_uuid TEXT NOT NULL, --file id
    source TEXT NOT NULL CHECK (source IN ('teacher', 'llm')),
    kind TEXT NOT NULL CHECK (kind IN ('inline', 'block')),
    comment_text TEXT NOT NULL,
    exactl_quote TEXT,
    prefix_text TEXT,
    suffix_text TEXT,
    applied INTEGER NOT NULL DEFAULT 0 CHECK (applied IN (0,1)),
    created_at TEXT NOT NULL,
    FOREIGN KEY (entity_uuid) REFERENCES filename(entity_uuid)
);
```
---
## Table feedback_anchors
```sql
CREATE TABLE feedback_anchors (
    feedback_uuid TEXT NOT NULL,
    anchor_kind TEXT NOT NULL CHECK (anchor_kind IN ('start', 'end')),
    part TEXT NOT NULL,
    paragraph_index INTEGER NOT NULL,
    run_index INTEGER NOT NULL,
    text_node_index INTEGER NOT NULL,
    char_offset INTEGER NOT NULL,
    PRIMARY KEY (feedback_uuid, anchor_kind),
    FOREIGN KEY (feedback_uuid) REFERENCES feedback(uuid) ON DELETE CASCADE
)

```
---
## Table: rubrics
```sql
CREATE TABLE rubrics (
    entity_uuid TEXT PRIMARY KEY,
    name TEXT,
    type TEXT CHECK (type IN ('flat', 'detailed')),
    FOREIGN KEY (entity_uuid) REFERENCES entities (uuid)
);
```

## Table rubric_details
```sql
CREATE TABLE rubric_details (
    uuid TEXT PRIMARY KEY,
    entity_uuid TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    FOREIGN KEY (entity_uuid) REFERENCES rubrics (entity_uuid)
);
```

## Table: rubric_scores
```sql
CREATE TABLE rubric_scores (
    uuid TEXT PRIMARY KEY,
    details_uuid TEXT NOT NULL,
    score_values INTEGER NOT NULL,
    FOREIGN KEY (details_uuid) REFERENCES rubric_details (uuid)
);
```

## Table: file_rubric_instances
```sql
CREATE TABLE file_rubric_instances (
    uuid TEXT PRIMARY KEY,
    file_entity_uuid TEXT NOT NULL,
    rubric_entity_uuid TEXT NOT NULL,
    created_at TEXT NOT NULL,
    edited_at TEXT,
    FOREIGN KEY (file_entity_uuid) REFERENCES filename(entity_uuid),
    FOREIGN KEY (rubric_entity_uuid) REFERENCES rubrics(entity_uuid)
);
```
---
# Table: file_rubric_scores
```sql
CREATE TABLE file_rubric_scores (
    uuid TEXT PRIMARY KEY,
    rubric_instance_uuid TEXT NOT NULL,
    rubric_detail_uuid TEXT NOT NULL,
    assigned_score TEXT NOT NULL,
    created_at TEXT NOT NULL,
    edited_at TEXT,
    FOREIGN KEY (rubric_instance_uuid) REFERENCES file_rubric_instances(uuid) ON DELETE CASCADE,
    FOREIGN KEY (rubric_detail_uuid) REFERENCES rubric_details(uuid)
);
```



## Table: chats
```sql
CREATE TABLE chats (
    uuid TEXT PRIMARY KEY,
    entity_uuid TEXT NOT NULL,
    chat_role TEXT NOT NULL,
    chat_header TEXT,
    chat_content TEXT,
    created_at TEXT,
    FOREIGN KEY (entity_uuid) REFERENCES entities (uuid)
)
```

## Table: audit
```sql 
CREATE TABLE audit (
    uuid TEXT PRIMARY KEY,
    entity_uuid TEXT NULL,
    user_action TEXT NOT NULL CHECK (user_action IN ('chat-doc', 'attach-folder', 'add-block-comment', 'add-inline-comment', 'generate-llm-inline-comment', 'generate-llm-block-comment', 'attach-rubric', 'edit-rubric', 'create-new-rubric', 'score-with-rubric')),
    target_table TEXT NOT NULL,
    target_uuid TEXT NOT NULL,
    metadata TEXT,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (entity_uuid) REFERENCES entities (uuid)
);
```

## INDEXES
```sql
-- Heavy querying
CREATE INDEX idx_feedback_entity ON feedback(entity_uuid);
CREATE INDEX idx_chats_entity ON chats(entity_uuid);
CREATE INDEX idx_audit_entity ON audit(entity_uuid);
CREATE INDEX idx_filename_path ON filename(filepath_uuid);

-- Handling rubrics
CREATE INDEX idx_rubric_instances_file ON file_rubric_instances(file_entity_uuid);
CREATE INDEX idx_rubric_instances_rubric ON file_rubric_instances(rubric_entity_uuid);
CREATE INDEX idx_rubric_scores_instance ON file_rubric_scores(rubric_instance_uuid);
CREATE INDEX idx_rubric_scores_detail ON file_rubric_scores(rubric_detail_uuid);

-- enforce uniqueness; prevents two scores for same criterion in the same grading session
CREATE UNIQUE INDEX idx_unique_instance_detail ON file_rubric_scores(rubric_instance_uuid, rubric_detail_uuid);

-- For cleanup
CREATE INDEX idx_rubric_instances_file ON file_rubric_instances(file_entity_uuid);
CREATE INDEX idx_rubric_instances_rubric ON file_rubric_instances(rubric_entity_uuid);
CREATE INDEX idx_rubric_scores_instance ON file_rubric_scores(rubric_instance_uuid);
CREATE UNIQUE INDEX idx_unique_instance_detail ON file_rubric_scores(rubric_instance_uuid, rubric_detail_uuid);

-- For future heavy analytics
CREATE INDEX idx_rubric_scores_detail ON file_rubric_scores(rubric_detail_uuid);
```
