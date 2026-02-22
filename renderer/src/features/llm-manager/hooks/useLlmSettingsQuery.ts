import { useQuery } from '@tanstack/react-query';
import { getSettings } from '../services/llmManagerApi';
import { llmManagerQueryKeys } from './queryKeys';

export function useLlmSettingsQuery(enabled = true) {
  return useQuery({
    queryKey: llmManagerQueryKeys.settings(),
    queryFn: getSettings,
    enabled
  });
}
