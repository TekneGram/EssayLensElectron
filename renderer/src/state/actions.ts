import type {
  AssessmentTopTab,
  ChatMessage,
  ChatState,
  CommentsTab,
  DocumentTextModel,
  EntityId,
  FeedbackItem,
  FeedbackState,
  RubricMatrix,
  RubricState,
  RubricSummary,
  SelectedFileState,
  Theme,
  WorkspaceFile,
  WorkspaceFolder,
  WorkspaceState
} from './types';

export type WorkspaceAction =
  | { type: 'workspace/setFolder'; payload: WorkspaceFolder | null }
  | { type: 'workspace/setFiles'; payload: WorkspaceFile[] }
  | { type: 'workspace/setStatus'; payload: WorkspaceState['status'] }
  | { type: 'workspace/setError'; payload?: string }
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
  | { type: 'rubric/selectEditing'; payload: EntityId | null }
  | { type: 'rubric/selectGradingForFile'; payload: { fileId: EntityId; rubricId: EntityId | null } }
  | { type: 'rubric/setLockedGradingRubricId'; payload: EntityId | null }
  | { type: 'rubric/setMatrix'; payload: RubricMatrix | null }
  | { type: 'rubric/setInteractionMode'; payload: RubricState['interactionMode'] }
  | {
      type: 'rubric/setGradingSelection';
      payload: { fileId: EntityId; rubricId: EntityId; selectedCellKeys: string[] };
    }
  | { type: 'rubric/clearGradingSelection'; payload: { fileId: EntityId } }
  | { type: 'rubric/setStatus'; payload: RubricState['status'] }
  | { type: 'rubric/setError'; payload?: string };

export type UiAction =
  | { type: 'ui/setTopTab'; payload: AssessmentTopTab }
  | { type: 'ui/setCommentsTab'; payload: CommentsTab }
  | { type: 'ui/setTheme'; payload: Theme }
  | { type: 'ui/setChatCollapsed'; payload: boolean }
  | { type: 'ui/setAssessmentSplitRatio'; payload: number };

export type AppAction = WorkspaceAction | ChatAction | FeedbackAction | RubricAction | UiAction;
