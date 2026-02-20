import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch } from '../../../state';
import { listRubrics } from '../services/rubricApi';
import { rubricQueryKeys } from './queryKeys';

export function useRubricListQuery() {
  const dispatch = useAppDispatch();
  const lastErrorAt = useRef<number | null>(null);

  const query = useQuery({
    queryKey: rubricQueryKeys.list(),
    queryFn: listRubrics
  });

  useEffect(() => {
    if (query.isPending) {
      dispatch({ type: 'rubric/setStatus', payload: 'loading' });
      dispatch({ type: 'rubric/setError', payload: undefined });
    }
  }, [dispatch, query.isPending]);

  useEffect(() => {
    if (!query.isSuccess) {
      return;
    }

    dispatch({
      type: 'rubric/setList',
      payload: query.data.rubrics.map((rubric) => ({ id: rubric.entityUuid, name: rubric.name }))
    });
    dispatch({ type: 'rubric/setStatus', payload: 'idle' });
    dispatch({ type: 'rubric/setError', payload: undefined });
  }, [dispatch, query.data, query.isSuccess]);

  useEffect(() => {
    if (!query.isError) {
      return;
    }

    const nextErrorAt = query.errorUpdatedAt;
    if (lastErrorAt.current === nextErrorAt) {
      return;
    }
    lastErrorAt.current = nextErrorAt;

    const message = query.error instanceof Error ? query.error.message : 'Unable to load rubrics.';
    dispatch({ type: 'rubric/setStatus', payload: 'error' });
    dispatch({ type: 'rubric/setError', payload: message });
    toast.error(message);
  }, [dispatch, query.error, query.errorUpdatedAt, query.isError]);

  return query;
}
