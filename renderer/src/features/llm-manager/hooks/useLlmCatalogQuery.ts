import { useQuery } from '@tanstack/react-query';
import { listCatalogModels } from '../services/llmManagerApi';
import { llmManagerQueryKeys } from './queryKeys';

export function useLlmCatalogQuery() {
  return useQuery({
    queryKey: llmManagerQueryKeys.catalog(),
    queryFn: listCatalogModels
  });
}
