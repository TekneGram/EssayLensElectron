import type { AssessmentTopTab, CommentsTab, EntityId, Theme } from './primitives';
import type {
  FeedbackItem,
  RubricGradingSelection,
  RubricMatrix,
  RubricSummary
} from './models';
import type { ChatState } from '../features/chat-interface/domain';
import type { WorkspaceState } from '../features/workspace/domain/workspace.types';

export interface FeedbackState {
  byFileId: Record<string, FeedbackItem[]>;
  status: 'idle' | 'loading' | 'error';
  error?: string;
}

export interface RubricState {
  rubricList: RubricSummary[];
  selectedEditingRubricId: EntityId | null;
  selectedGradingRubricIdByFileId: Record<string, EntityId | undefined>;
  lockedGradingRubricId: EntityId | null;
  activeMatrix: RubricMatrix | null;
  interactionMode: 'editing' | 'viewing';
  gradingSelectionByFileId: Record<string, RubricGradingSelection | undefined>;
  status: 'idle' | 'loading' | 'error';
  error?: string;
}

export interface UiState {
  activeTopTab: AssessmentTopTab;
  activeCommentsTab: CommentsTab;
  theme: Theme;
  isChatCollapsed: boolean;
  assessmentSplitRatio: number;
}

export interface AppState {
  workspace: WorkspaceState;
  chat: ChatState;
  feedback: FeedbackState;
  rubric: RubricState;
  ui: UiState;
}

export type SelectedFileType = 'image' | 'docx' | 'pdf' | 'other' | null;

export type { ChatState };
export type { WorkspaceState };
