import type { AssessmentTopTab, CommentsTab, EntityId, Theme } from './primitives';
import type { ChatDataArray, DocumentTextModel, FeedbackItem, RubricMatrix, RubricSummary, SelectedFileState, WorkspaceFile, WorkspaceFolder } from './models';

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
