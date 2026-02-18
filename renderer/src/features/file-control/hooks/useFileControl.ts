import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import type { AppError } from '../../../../../electron/shared/appResult';
import type { SelectFolderResultData } from '../../../../../electron/shared/workspaceContracts';
import { useAppDispatch, useAppState } from '../../../state';
import type { WorkspaceFile, WorkspaceFolder } from '../../../types';

interface AppResultSuccess<T> {
  ok: true;
  data: T;
}

interface AppResultFailure {
  ok: false;
  error: AppError;
}

type SelectFolderResult = AppResultSuccess<SelectFolderResultData> | AppResultFailure;

interface UseFileControlResult {
  files: WorkspaceFile[];
  isLoading: boolean;
  pickFolder: () => Promise<void>;
}

type WorkspaceApi = {
  selectFolder: () => Promise<SelectFolderResult>;
};

function getWorkspaceApi(): WorkspaceApi {
  const appWindow = window as Window & { api?: { workspace?: WorkspaceApi } };
  if (!appWindow.api?.workspace) {
    throw new Error('window.api.workspace is not available.');
  }
  return appWindow.api.workspace;
}

function toWorkspaceFolder(folder: SelectFolderResultData['folder']): WorkspaceFolder | null {
  if (!folder) {
    return null;
  }
  return {
    id: folder.id,
    path: folder.path,
    name: folder.name
  };
}

export function useFileControl(): UseFileControlResult {
  const dispatch = useAppDispatch();
  const state = useAppState();

  const mutation = useMutation({
    mutationFn: async () => {
      return await getWorkspaceApi().selectFolder();
    },
    onMutate: () => {
      dispatch({ type: 'workspace/setStatus', payload: 'loading' });
      dispatch({ type: 'workspace/setError', payload: undefined });
    },
    onSuccess: (result) => {
      if (!result.ok) {
        dispatch({ type: 'workspace/setStatus', payload: 'error' });
        dispatch({ type: 'workspace/setError', payload: result.error.message });
        toast.error(result.error.message);
        return;
      }

      dispatch({ type: 'workspace/setFolder', payload: toWorkspaceFolder(result.data.folder) });
      dispatch({ type: 'workspace/setStatus', payload: 'idle' });
      dispatch({ type: 'workspace/setError', payload: undefined });
    },
    onError: () => {
      const message = 'Could not select a folder.';
      dispatch({ type: 'workspace/setStatus', payload: 'error' });
      dispatch({ type: 'workspace/setError', payload: message });
      toast.error(message);
    }
  });

  return {
    files: state.workspace.files,
    isLoading: mutation.isPending || state.workspace.status === 'loading',
    pickFolder: async () => {
      await mutation.mutateAsync();
    }
  };
}
