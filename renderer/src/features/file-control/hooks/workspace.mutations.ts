import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import type { Dispatch } from 'react';
import type { AppAction } from '../../../state';
import { getWorkspaceApi } from './workspace.api';
import { toWorkspaceFiles, toWorkspaceFolder } from './workspace.mappers';

export function useSelectFolderMutation(dispatch: Dispatch<AppAction>) {
  return useMutation({
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
}
