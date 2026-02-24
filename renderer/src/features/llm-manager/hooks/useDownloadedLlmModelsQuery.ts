import { useQuery } from '@tanstack/react-query';
import { listDownloadedModels } from '../services/llmManagerApi';
import { llmManagerQueryKeys } from './queryKeys';

export function useDownloadedLlmModelsQuery(enabled = true) {
  return useQuery({
    queryKey: llmManagerQueryKeys.downloaded(),
    queryFn: listDownloadedModels,
    enabled
  });
}
