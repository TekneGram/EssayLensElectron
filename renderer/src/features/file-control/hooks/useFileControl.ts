import { useAppDispatch, useAppState } from '../../../state';
import type { WorkspaceFile } from '../../../types';
import { useSelectFolderMutation } from './workspace.mutations';

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
  const selectFolderMutation = useSelectFolderMutation(dispatch);

  return {
    files: state.workspace.files,
    selectedFileId: state.workspace.selectedFile.fileId,
    isLoading: selectFolderMutation.isPending || state.workspace.status === 'loading',
    pickFolder: async () => {
      await selectFolderMutation.mutateAsync();
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
