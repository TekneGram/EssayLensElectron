import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import type { Dispatch } from 'react';
import { toast } from 'react-toastify';
import { usePorts } from '../../../ports';
import { listAssessmentFeedback } from '../application/assessmentApi.service';
import type { AssessmentTabAction } from '../state';
import { assessmentQueryKeys } from './queryKeys';

export function useFeedbackListQuery(fileId: string | null, dispatch: Dispatch<AssessmentTabAction>) {
  const { assessment } = usePorts();
  const lastErrorAt = useRef<number | null>(null);

  const query = useQuery({
    queryKey: assessmentQueryKeys.feedbackList(fileId ?? 'none'),
    enabled: Boolean(fileId),
    queryFn: async () => {
      if (!fileId) {
        return [];
      }
      return listAssessmentFeedback(assessment, fileId);
    }
  });

  useEffect(() => {
    if (!fileId) {
      dispatch({ type: 'assessmentTab/setFeedbackStatus', payload: 'idle' });
      dispatch({ type: 'assessmentTab/setFeedbackError', payload: undefined });
      return;
    }
    if (query.isPending) {
      dispatch({ type: 'assessmentTab/setFeedbackStatus', payload: 'loading' });
      dispatch({ type: 'assessmentTab/setFeedbackError', payload: undefined });
    }
  }, [dispatch, fileId, query.isPending]);

  useEffect(() => {
    if (!fileId || !query.isSuccess) {
      return;
    }

    dispatch({
      type: 'assessmentTab/setFeedbackForFile',
      payload: {
        fileId,
        items: query.data
      }
    });
    dispatch({ type: 'assessmentTab/setFeedbackStatus', payload: 'idle' });
    dispatch({ type: 'assessmentTab/setFeedbackError', payload: undefined });
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
    dispatch({ type: 'assessmentTab/setFeedbackStatus', payload: 'error' });
    dispatch({ type: 'assessmentTab/setFeedbackError', payload: message });
    toast.error(message);
  }, [dispatch, query.error, query.errorUpdatedAt, query.isError]);

  return query;
}
