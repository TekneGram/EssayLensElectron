import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DownloadedLlmModelDto, LlmModelKey, LlmRuntimeSettings } from '../../../../../electron/shared/llmManagerContracts';
import { downloadModel, resetSettingsToDefaults, selectModel, updateSettings } from '../services/llmManagerApi';
import { llmManagerQueryKeys } from './queryKeys';

export function useLlmManagerMutations() {
  const queryClient = useQueryClient();

  const downloadMutation = useMutation({
    mutationFn: async (key: LlmModelKey): Promise<DownloadedLlmModelDto> => downloadModel(key),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: llmManagerQueryKeys.downloaded() });
      await queryClient.invalidateQueries({ queryKey: llmManagerQueryKeys.activeModel() });
    }
  });

  const selectMutation = useMutation({
    mutationFn: selectModel,
    onSuccess: async (data) => {
      queryClient.setQueryData(llmManagerQueryKeys.activeModel(), data.activeModel);
      queryClient.setQueryData(llmManagerQueryKeys.settings(), data.settings);
      await queryClient.invalidateQueries({ queryKey: llmManagerQueryKeys.downloaded() });
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Partial<LlmRuntimeSettings>) => updateSettings(settings),
    onSuccess: (settings) => {
      queryClient.setQueryData(llmManagerQueryKeys.settings(), settings);
    }
  });

  const resetSettingsMutation = useMutation({
    mutationFn: resetSettingsToDefaults,
    onSuccess: (data) => {
      queryClient.setQueryData(llmManagerQueryKeys.activeModel(), data.activeModel);
      queryClient.setQueryData(llmManagerQueryKeys.settings(), data.settings);
      queryClient.invalidateQueries({ queryKey: llmManagerQueryKeys.downloaded() });
    }
  });

  return {
    downloadModel: downloadMutation.mutateAsync,
    selectModel: selectMutation.mutateAsync,
    updateSettings: updateSettingsMutation.mutateAsync,
    resetSettingsToDefaults: resetSettingsMutation.mutateAsync,
    isDownloading: downloadMutation.isPending,
    isSelecting: selectMutation.isPending,
    isSavingSettings: updateSettingsMutation.isPending,
    isResettingSettings: resetSettingsMutation.isPending,
    downloadError: downloadMutation.error instanceof Error ? downloadMutation.error.message : undefined,
    selectError: selectMutation.error instanceof Error ? selectMutation.error.message : undefined,
    settingsError:
      updateSettingsMutation.error instanceof Error
        ? updateSettingsMutation.error.message
        : resetSettingsMutation.error instanceof Error
          ? resetSettingsMutation.error.message
          : undefined
  };
}
