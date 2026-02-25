import type { WorkspaceAction } from './workspace.actions';
import type { WorkspaceState } from '../domain/workspace.types';
import type { AppAction } from '../../../state/actions';

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

export function workspaceReducer(
  state: WorkspaceState = initialWorkspaceState,
  action: WorkspaceAction | AppAction
): WorkspaceState {
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
