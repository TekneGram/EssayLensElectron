import { useQuery } from '@tanstack/react-query';
import { usePorts } from '../../../ports';
import { listCatalogModels } from '../application/llmManager.service';
import { llmManagerQueryKeys } from '../infrastructure/queryKeys';

export function useLlmCatalogQuery() {
  const { llmManager } = usePorts();

  return useQuery({
    queryKey: llmManagerQueryKeys.catalog(),
    queryFn: async () => listCatalogModels(llmManager)
  });
}
