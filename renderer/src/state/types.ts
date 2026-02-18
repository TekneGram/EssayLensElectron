export type EntityId = string;

export type AssessmentTopTab = 'assessment' | 'rubric';
export type CommentsTab = 'comments' | 'score';
export type Theme = 'light' | 'dark' | 'system';

export type FileKind =
  | 'docx'
  | 'pdf'
  | 'jpeg'
  | 'jpg'
  | 'png'
  | 'gif'
  | 'webp'
  | 'bmp'
  | 'svg'
  | 'heic'
  | 'heif'
  | 'avif'
  | 'tiff'
  | 'tif'
  | 'unknown';

export interface WorkspaceFolder {
  id: EntityId;
  path: string;
  name: string;
  selectedAt?: string;
}

export interface WorkspaceFile {
  id: EntityId;
  folderId: EntityId;
  name: string;
  path: string;
  kind: FileKind;
  imagePath?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SelectedFileState {
  fileId: EntityId | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error?: string;
}

export interface DocumentTextModel {
  fileId: EntityId;
  text: string;
  extractedAt?: string;
}

export type ChatRole = 'system' | 'teacher' | 'assistant';

export interface ChatMessage {
  id: EntityId;
  role: ChatRole;
  content: string;
  relatedFileId?: EntityId;
  createdAt: string;
}

export interface FeedbackItem {
  id: EntityId;
  fileId: EntityId;
  source: 'teacher' | 'llm';
  kind: 'inline' | 'block';
  content: string;
  anchor?: {
    start: number;
    end: number;
  };
  createdAt: string;
  updatedAt?: string;
}

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

export interface WorkspaceState {
  currentFolder: WorkspaceFolder | null;
  files: WorkspaceFile[];
  selectedFile: SelectedFileState;
  documentTextByFileId: Record<string, DocumentTextModel | undefined>;
}

export interface ChatState {
  messages: ChatMessage[];
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
  theme: Theme;
}

export interface AppState {
  workspace: WorkspaceState;
  chat: ChatState;
  feedback: FeedbackState;
  rubric: RubricState;
  ui: UiState;
}

export type SelectedFileType = 'image' | 'docx' | 'pdf' | 'other' | null;
