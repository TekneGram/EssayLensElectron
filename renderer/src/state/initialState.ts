import type { AppState, ChatState, FeedbackState, RubricState, UiState, WorkspaceState } from './types';

export const initialWorkspaceState: WorkspaceState = {
  currentFolder: null,
  files: [],
  status: 'idle',
  selectedFile: {
    fileId: null,
    status: 'idle'
  },
  documentTextByFileId: {}
};

export const initialChatState: ChatState = {
  messages: [],
  draft: '',
  status: 'idle'
};

export const initialFeedbackState: FeedbackState = {
  byFileId: {},
  status: 'idle'
};

export const initialRubricState: RubricState = {
  rubricList: [],
  selectedRubricId: null,
  activeMatrix: null,
  interactionMode: 'editing',
  gradingSelectionByFileId: {},
  status: 'idle'
};

export const initialUiState: UiState = {
  activeTopTab: 'assessment',
  activeCommentsTab: 'comments',
  theme: 'system',
  isChatCollapsed: false,
  assessmentSplitRatio: 0.66
};

export const initialAppState: AppState = {
  workspace: initialWorkspaceState,
  chat: initialChatState,
  feedback: initialFeedbackState,
  rubric: initialRubricState,
  ui: initialUiState
};
