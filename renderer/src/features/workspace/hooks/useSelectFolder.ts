import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import type { Dispatch } from 'react';
import type { AppAction } from '../../../state';
import { selectWorkspaceFolder } from '../application/workspace.service';
import { getWorkspaceApi } from '../infrastructure/workspace.api';

export function useSelectFolder(dispatch: Dispatch<AppAction>) {
  return useMutation({
    mutationFn: async () => {
      const api = getWorkspaceApi();
      return selectWorkspaceFolder(api);
    },

    onMutate: () => {
      dispatch({ type: 'workspace/setStatus', payload: 'loading' });
      dispatch({ type: 'workspace/setError', payload: undefined });
    },

    onSuccess: ({ folder, files }) => {
      dispatch({ type: 'workspace/setFolder', payload: folder });
      dispatch({ type: 'workspace/setFiles', payload: files });
      dispatch({ type: 'workspace/setSelectedFile', payload: { fileId: null, status: 'idle' } });
      dispatch({ type: 'workspace/setStatus', payload: 'idle' });
    },

    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Could not select folder.';
      dispatch({ type: 'workspace/setStatus', payload: 'error' });
      dispatch({ type: 'workspace/setError', payload: message });
      toast.error(message);
    }
  });
}
