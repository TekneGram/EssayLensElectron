# TypeScript Interfaces Spec (Round 1)

## Purpose
Define the minimum TypeScript interfaces required to build the first UI frame and first end-to-end workflows without overcommitting to final backend schema details.

## Scope (Round 1)
- In scope:
  - Shared primitive types
  - Core frontend read models for files/chat/feedback/rubric
  - Minimal global state slices for Context + reducers
  - Initial command payloads for key user actions
  - Initial IPC/query result envelope
- Out of scope (defer to later rounds):
  - Full DB row mirror interfaces for every table
  - Full rubric scoring persistence contracts
  - Full document generation payload contracts
  - Detailed LLM transport/protocol schemas

## Design Rules
1. Prefer UI-aligned read models over raw DB-row mirrors in renderer.
2. Keep IDs opaque (`string`) and stable.
3. Separate read models from write commands.
4. Add optional fields for evolving flows only when they are genuinely uncertain.

## 1) Shared Primitives

```ts
export type EntityId = string;
export type ISODateString = string;

export type FileKind = 'docx' | 'pdf' | 'jpeg' | 'jpg' | 'png' | 'gif' | 'webp' | 'bmp' | 'svg' | 'heic' | 'heif' | 'avif' | 'tiff' | 'tif' | 'unknown';
export type CommentKind = 'inline' | 'block';
export type ChatRole = 'system' | 'teacher' | 'assistant';

export type AssessmentTopTab = 'assessment' | 'rubric';
export type CommentsTab = 'comments' | 'score';

// File extension detection should be normalized to lowercase before mapping to FileKind.
```

## 2) Core Frontend Read Models

### Workspace / files
```ts
export interface WorkspaceFolder {
  id: EntityId;
  path: string;
  name: string;
  selectedAt?: ISODateString;
}

export interface WorkspaceFile {
  id: EntityId;
  folderId: EntityId;
  name: string;
  path: string;
  kind: FileKind;
  imagePath?: string; // only for image-kind files
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

export interface SelectedFileState {
  fileId: EntityId | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error?: string;
}
```

### Document/text view
```ts
export interface DocumentTextModel {
  fileId: EntityId;
  text: string;
  extractedAt?: ISODateString;
}
```

### Chat
```ts
export interface ChatMessage {
  id: EntityId;
  role: ChatRole;
  content: string;
  relatedFileId?: EntityId;
  createdAt: ISODateString;
}

export type ChatDataArray = ChatMessage[];
```

### Feedback/comments
```ts
export interface FeedbackItem {
  id: EntityId;
  fileId: EntityId;
  source: 'teacher' | 'llm';
  kind: CommentKind;
  content: string;
  anchor?: {
    start: number;
    end: number;
  };
  createdAt: ISODateString;
  updatedAt?: ISODateString;
}
```

### Rubric (minimal for first render)
```ts
export interface RubricSummary {
  id: EntityId;
  name: string;
  description?: string;
}

export interface RubricCategory {
  id: EntityId;
  name: string;
}

export interface RubricScoreLevel {
  id: EntityId;
  value: number;
}

export interface RubricCell {
  categoryId: EntityId;
  scoreId: EntityId;
  description: string;
}

export interface RubricMatrix {
  rubricId: EntityId;
  rubricName: string;
  categories: RubricCategory[];
  scores: RubricScoreLevel[];
  cells: RubricCell[];
}
```

## 3) Global State Shape (Context + Reducers)

```ts
export interface WorkspaceState {
  currentFolder: WorkspaceFolder | null;
  files: WorkspaceFile[];
  selectedFile: SelectedFileState;
  documentTextByFileId: Record<string, DocumentTextModel | undefined>;
}

export interface ChatState {
  messages: ChatDataArray;
  draft: string;
  status: 'idle' | 'sending' | 'error';
  error?: string;
}

export interface FeedbackState {
  byFileId: Record<string, FeedbackItem[]>;
  status: 'idle' | 'loading' | 'error';
  error?: string;
}

export interface RubricState {
  rubricList: RubricSummary[];
  selectedRubricId: EntityId | null;
  activeMatrix: RubricMatrix | null;
  status: 'idle' | 'loading' | 'error';
  error?: string;
}

export interface UiState {
  activeTopTab: AssessmentTopTab;
  activeCommentsTab: CommentsTab;
  theme: 'light' | 'dark' | 'system';
}

export interface AppState {
  workspace: WorkspaceState;
  chat: ChatState;
  feedback: FeedbackState;
  rubric: RubricState;
  ui: UiState;
}
```

## 4) Initial Command Payload Interfaces (Writes)

```ts
export interface SelectFolderCommand {
  path: string;
}

export interface SelectFileCommand {
  fileId: EntityId;
}

export interface AddFeedbackCommand {
  fileId: EntityId;
  kind: CommentKind;
  content: string;
  anchor?: {
    start: number;
    end: number;
  };
}

export interface RequestLlmAssessmentCommand {
  fileId: EntityId;
  instruction?: string;
}

export interface SendChatMessageCommand {
  fileId?: EntityId;
  content: string;
}
```

## 5) Initial Reducer Action Unions (minimal)

```ts
export type WorkspaceAction =
  | { type: 'workspace/setFolder'; payload: WorkspaceFolder | null }
  | { type: 'workspace/setFiles'; payload: WorkspaceFile[] }
  | { type: 'workspace/setSelectedFile'; payload: SelectedFileState }
  | { type: 'workspace/setDocumentText'; payload: DocumentTextModel };

export type ChatAction =
  | { type: 'chat/setMessages'; payload: ChatMessage[] }
  | { type: 'chat/addMessage'; payload: ChatMessage }
  | { type: 'chat/setDraft'; payload: string }
  | { type: 'chat/setStatus'; payload: ChatState['status'] }
  | { type: 'chat/setError'; payload?: string };

export type FeedbackAction =
  | { type: 'feedback/setForFile'; payload: { fileId: EntityId; items: FeedbackItem[] } }
  | { type: 'feedback/add'; payload: FeedbackItem }
  | { type: 'feedback/setStatus'; payload: FeedbackState['status'] }
  | { type: 'feedback/setError'; payload?: string };

export type RubricAction =
  | { type: 'rubric/setList'; payload: RubricSummary[] }
  | { type: 'rubric/select'; payload: EntityId | null }
  | { type: 'rubric/setMatrix'; payload: RubricMatrix | null }
  | { type: 'rubric/setStatus'; payload: RubricState['status'] }
  | { type: 'rubric/setError'; payload?: string };

export type UiAction =
  | { type: 'ui/setTopTab'; payload: AssessmentTopTab }
  | { type: 'ui/setCommentsTab'; payload: CommentsTab }
  | { type: 'ui/setTheme'; payload: UiState['theme'] };

export type AppAction =
  | WorkspaceAction
  | ChatAction
  | FeedbackAction
  | RubricAction
  | UiAction;
```

## 6) Result / Error Envelope

```ts
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

export type AppResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };
```

## 7) What to Add in Round 2
- DB row interfaces per table (`filepath`, `filename`, `image`, `feedback`, `chats`, `rubrics`, `rubric_details`, `rubric_scores`, `file_rubric_instances`, `file_rubric_scores`).
- Rubric grading write contracts.
- Feedback-file generation request/response contracts.
- LLM request/response envelope refinement.

## Suggested File Placement

```txt
src/
  types/
    primitives.ts
    workspace.ts
    chat.ts
    feedback.ts
    rubric.ts
    state.ts
    actions.ts
    commands.ts
    result.ts
```

This split keeps shared contracts discoverable and avoids very large single-file type definitions.
