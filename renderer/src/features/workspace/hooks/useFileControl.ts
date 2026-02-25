import { useAppDispatch, useAppState } from '../../../state';
import type { WorkspaceFile } from '../domain/workspace.types';
import { useSelectFolder } from './useSelectFolder';

interface UseFileControlResult {
  files: WorkspaceFile[];
  selectedFileId: string | null;
  isLoading: boolean;
  pickFolder: () => Promise<void>;
  selectFile: (file: WorkspaceFile) => void;
}

export function useFileControl(): UseFileControlResult {
  const dispatch = useAppDispatch();
  const state = useAppState();
  const selectFolderMutation = useSelectFolder(dispatch);

  return {
    files: state.workspace.files,
    selectedFileId: state.workspace.selectedFile.fileId,
    isLoading: selectFolderMutation.isPending || state.workspace.status === 'loading',
    pickFolder: async () => {
      try {
        await selectFolderMutation.mutateAsync();
      } catch {
        // The mutation handles state + toast updates in onError.
      }
    },
    selectFile: (file) => {
      dispatch({ type: 'workspace/setSelectedFile', payload: { fileId: file.id, status: 'ready' } });
      dispatch({
        type: 'chat/addMessage',
        payload: {
          id: `system-${file.id}-${Date.now()}`,
          role: 'system',
          content: `Selected file: ${file.name}`,
          relatedFileId: file.id,
          createdAt: new Date().toISOString()
        }
      });
    }
  };
}
