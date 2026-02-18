import type { AppAction } from './actions';
import { initialAppState, initialChatState, initialFeedbackState, initialRubricState, initialUiState, initialWorkspaceState } from './initialState';
import type { AppState, ChatState, FeedbackState, RubricState, UiState, WorkspaceState } from './types';

const ASSESSMENT_SPLIT_MIN = 0.35;
const ASSESSMENT_SPLIT_MAX = 0.8;

function clampAssessmentSplitRatio(value: number): number {
  if (!Number.isFinite(value)) {
    return initialUiState.assessmentSplitRatio;
  }
  return Math.min(ASSESSMENT_SPLIT_MAX, Math.max(ASSESSMENT_SPLIT_MIN, value));
}

export function workspaceReducer(state: WorkspaceState = initialWorkspaceState, action: AppAction): WorkspaceState {
  switch (action.type) {
    case 'workspace/setFolder':
      return {
        ...state,
        currentFolder: action.payload
      };
    case 'workspace/setFiles':
      return {
        ...state,
        files: action.payload
      };
    case 'workspace/setStatus':
      return {
        ...state,
        status: action.payload
      };
    case 'workspace/setError':
      return {
        ...state,
        error: action.payload
      };
    case 'workspace/setSelectedFile':
      return {
        ...state,
        selectedFile: action.payload
      };
    case 'workspace/setDocumentText':
      return {
        ...state,
        documentTextByFileId: {
          ...state.documentTextByFileId,
          [action.payload.fileId]: action.payload
        }
      };
    default:
      return state;
  }
}

export function chatReducer(state: ChatState = initialChatState, action: AppAction): ChatState {
  switch (action.type) {
    case 'chat/setMessages':
      return {
        ...state,
        messages: action.payload
      };
    case 'chat/addMessage':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    case 'chat/setDraft':
      return {
        ...state,
        draft: action.payload
      };
    case 'chat/setStatus':
      return {
        ...state,
        status: action.payload
      };
    case 'chat/setError':
      return {
        ...state,
        error: action.payload
      };
    default:
      return state;
  }
}

export function feedbackReducer(state: FeedbackState = initialFeedbackState, action: AppAction): FeedbackState {
  switch (action.type) {
    case 'feedback/setForFile':
      return {
        ...state,
        byFileId: {
          ...state.byFileId,
          [action.payload.fileId]: action.payload.items
        }
      };
    case 'feedback/add': {
      const existing = state.byFileId[action.payload.fileId] ?? [];
      return {
        ...state,
        byFileId: {
          ...state.byFileId,
          [action.payload.fileId]: [...existing, action.payload]
        }
      };
    }
    case 'feedback/setStatus':
      return {
        ...state,
        status: action.payload
      };
    case 'feedback/setError':
      return {
        ...state,
        error: action.payload
      };
    default:
      return state;
  }
}

export function rubricReducer(state: RubricState = initialRubricState, action: AppAction): RubricState {
  switch (action.type) {
    case 'rubric/setList':
      return {
        ...state,
        rubricList: action.payload
      };
    case 'rubric/select':
      return {
        ...state,
        selectedRubricId: action.payload
      };
    case 'rubric/setMatrix':
      return {
        ...state,
        activeMatrix: action.payload
      };
    case 'rubric/setStatus':
      return {
        ...state,
        status: action.payload
      };
    case 'rubric/setError':
      return {
        ...state,
        error: action.payload
      };
    default:
      return state;
  }
}

export function uiReducer(state: UiState = initialUiState, action: AppAction): UiState {
  switch (action.type) {
    case 'ui/setTopTab':
      return {
        ...state,
        activeTopTab: action.payload
      };
    case 'ui/setCommentsTab':
      return {
        ...state,
        activeCommentsTab: action.payload
      };
    case 'ui/setTheme':
      return {
        ...state,
        theme: action.payload
      };
    case 'ui/setChatCollapsed':
      return {
        ...state,
        isChatCollapsed: action.payload
      };
    case 'ui/setAssessmentSplitRatio':
      return {
        ...state,
        assessmentSplitRatio: clampAssessmentSplitRatio(action.payload)
      };
    default:
      return state;
  }
}

export function appReducer(state: AppState = initialAppState, action: AppAction): AppState {
  return {
    workspace: workspaceReducer(state.workspace, action),
    chat: chatReducer(state.chat, action),
    feedback: feedbackReducer(state.feedback, action),
    rubric: rubricReducer(state.rubric, action),
    ui: uiReducer(state.ui, action)
  };
}
