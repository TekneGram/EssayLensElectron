import { initialChatState } from '../features/chat-interface/state/chatInterface.initialState';
import type { AppState, FeedbackState, RubricState, UiState } from './types';
import { initialWorkspaceState } from '../features/workspace/state/workspace.reducer';

export const initialFeedbackState: FeedbackState = {
  byFileId: {},
  status: 'idle'
};

export const initialRubricState: RubricState = {
  rubricList: [],
  selectedEditingRubricId: null,
  selectedGradingRubricIdByFileId: {},
  lockedGradingRubricId: null,
  activeMatrix: null,
  interactionMode: 'viewing',
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

export { initialChatState };
export { initialWorkspaceState };
