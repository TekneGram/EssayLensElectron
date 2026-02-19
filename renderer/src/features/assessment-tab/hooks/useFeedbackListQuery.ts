import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch } from '../../../state';
import { listFeedback } from './feedbackApi';
import { assessmentQueryKeys } from './queryKeys';

export function useFeedbackListQuery(fileId: string | null) {
  const dispatch = useAppDispatch();
  const lastErrorAt = useRef<number | null>(null);

  const query = useQuery({
    queryKey: assessmentQueryKeys.feedbackList(fileId ?? 'none'),
    enabled: Boolean(fileId),
    queryFn: async () => {
      if (!fileId) {
        return [];
      }
      return listFeedback(fileId);
    }
  });

  useEffect(() => {
    if (!fileId) {
      dispatch({ type: 'feedback/setStatus', payload: 'idle' });
      dispatch({ type: 'feedback/setError', payload: undefined });
      return;
    }
    if (query.isPending) {
      dispatch({ type: 'feedback/setStatus', payload: 'loading' });
      dispatch({ type: 'feedback/setError', payload: undefined });
    }
  }, [dispatch, fileId, query.isPending]);

  useEffect(() => {
    if (!fileId || !query.isSuccess) {
      return;
    }

    dispatch({
      type: 'feedback/setForFile',
      payload: {
        fileId,
        items: query.data
      }
    });
    dispatch({ type: 'feedback/setStatus', payload: 'idle' });
    dispatch({ type: 'feedback/setError', payload: undefined });
  }, [dispatch, fileId, query.data, query.isSuccess]);

  useEffect(() => {
    if (!query.isError) {
      return;
    }

    const nextErrorAt = query.errorUpdatedAt;
    if (lastErrorAt.current === nextErrorAt) {
      return;
    }
    lastErrorAt.current = nextErrorAt;

    const message = query.error instanceof Error ? query.error.message : 'Unable to load comments.';
    dispatch({ type: 'feedback/setStatus', payload: 'error' });
    dispatch({ type: 'feedback/setError', payload: message });
    toast.error(message);
  }, [dispatch, query.error, query.errorUpdatedAt, query.isError]);

  return query;
}
