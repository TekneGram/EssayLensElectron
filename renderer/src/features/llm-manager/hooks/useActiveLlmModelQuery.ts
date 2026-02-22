import { useQuery } from '@tanstack/react-query';
import { getActiveModel } from '../services/llmManagerApi';
import { llmManagerQueryKeys } from './queryKeys';

export function useActiveLlmModelQuery(enabled = true) {
  return useQuery({
    queryKey: llmManagerQueryKeys.activeModel(),
    queryFn: getActiveModel,
    enabled
  });
}
