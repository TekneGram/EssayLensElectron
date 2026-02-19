import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import type { AppError } from '../../../../../electron/shared/appResult';
import type { ListFilesResponse, SelectFolderResponse, WorkspaceFileDto } from '../../../../../electron/shared/workspaceContracts';
import { useAppDispatch, useAppState } from '../../../state';
import { fileKindFromExtension, type WorkspaceFile, type WorkspaceFolder } from '../../../types';

interface AppResultSuccess<T> {
  ok: true;
  data: T;
}

interface AppResultFailure {
  ok: false;
  error: AppError;
}

type SelectFolderResult = AppResultSuccess<SelectFolderResponse> | AppResultFailure;
type ListFilesResult = AppResultSuccess<ListFilesResponse> | AppResultFailure;

interface UseFileControlResult {
  files: WorkspaceFile[];
  selectedFileId: string | null;
  isLoading: boolean;
  pickFolder: () => Promise<void>;
  selectFile: (file: WorkspaceFile) => void;
}

type WorkspaceApi = {
  selectFolder: () => Promise<SelectFolderResult>;
  listFiles: (folderId: string) => Promise<ListFilesResult>;
};

function getWorkspaceApi(): WorkspaceApi {
  const appWindow = window as Window & { api?: { workspace?: WorkspaceApi } };
  if (!appWindow.api?.workspace) {
    throw new Error('window.api.workspace is not available.');
  }
  return appWindow.api.workspace;
}

function toWorkspaceFolder(folder: SelectFolderResponse['folder']): WorkspaceFolder | null {
  if (!folder) {
    return null;
  }
  return {
    id: folder.id,
    path: folder.path,
    name: folder.name
  };
}

function toWorkspaceFiles(files: WorkspaceFileDto[]): WorkspaceFile[] {
  return files.map((file) => ({
    id: file.id,
    folderId: file.folderId,
    name: file.name,
    path: file.path,
    kind: fileKindFromExtension(file.kind)
  }));
}

export function useFileControl(): UseFileControlResult {
  const dispatch = useAppDispatch();
  const state = useAppState();

  const mutation = useMutation({
    mutationFn: async () => {
      const workspaceApi = getWorkspaceApi();
      const selectResult = await workspaceApi.selectFolder();
      if (!selectResult.ok || !selectResult.data.folder) {
        return {
          selectResult,
          listResult: null
        };
      }

      const listResult = await workspaceApi.listFiles(selectResult.data.folder.id);
      return {
        selectResult,
        listResult
      };
    },
    onMutate: () => {
      dispatch({ type: 'workspace/setStatus', payload: 'loading' });
      dispatch({ type: 'workspace/setError', payload: undefined });
    },
    onSuccess: ({ selectResult, listResult }) => {
      if (!selectResult.ok) {
        dispatch({ type: 'workspace/setStatus', payload: 'error' });
        dispatch({ type: 'workspace/setError', payload: selectResult.error.message });
        toast.error(selectResult.error.message);
        return;
      }

      if (!selectResult.data.folder) {
        dispatch({ type: 'workspace/setStatus', payload: 'idle' });
        dispatch({ type: 'workspace/setError', payload: undefined });
        return;
      }

      dispatch({ type: 'workspace/setFolder', payload: toWorkspaceFolder(selectResult.data.folder) });
      dispatch({ type: 'workspace/setSelectedFile', payload: { fileId: null, status: 'idle' } });
      dispatch({ type: 'workspace/setError', payload: undefined });

      if (!listResult) {
        dispatch({ type: 'workspace/setStatus', payload: 'idle' });
        return;
      }

      if (!listResult.ok) {
        dispatch({ type: 'workspace/setStatus', payload: 'error' });
        dispatch({ type: 'workspace/setError', payload: listResult.error.message });
        toast.error(listResult.error.message);
        return;
      }

      dispatch({ type: 'workspace/setFiles', payload: toWorkspaceFiles(listResult.data.files) });
      dispatch({ type: 'workspace/setStatus', payload: 'idle' });
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
    selectedFileId: state.workspace.selectedFile.fileId,
    isLoading: mutation.isPending || state.workspace.status === 'loading',
    pickFolder: async () => {
      await mutation.mutateAsync();
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
