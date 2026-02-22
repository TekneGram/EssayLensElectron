import { useEffect, useState } from 'react';
import type { DownloadProgressEvent, LlmModelKey } from '../../../../electron/shared/llmManagerContracts';
import { LlmConfiguration } from './components/LlmConfiguration';
import { LlmDownload } from './components/LlmDownload';
import { LlmSelector } from './components/LlmSelector';
import { useActiveLlmModelQuery } from './hooks/useActiveLlmModelQuery';
import { useDownloadedLlmModelsQuery } from './hooks/useDownloadedLlmModelsQuery';
import { useLlmCatalogQuery } from './hooks/useLlmCatalogQuery';
import { useLlmManagerMutations } from './hooks/useLlmManagerMutations';
import { useLlmSettingsQuery } from './hooks/useLlmSettingsQuery';
import { subscribeToDownloadProgress } from './services/llmManagerApi';
import './styles/llm-manager.css';

interface DownloadProgressView {
  event: DownloadProgressEvent;
}

export function LlmManager() {
  const hasLlmManagerApi = Boolean((window as Window & { api?: { llmManager?: unknown } }).api?.llmManager);
  const catalogQuery = useLlmCatalogQuery();
  const downloadedQuery = useDownloadedLlmModelsQuery(hasLlmManagerApi);
  const activeModelQuery = useActiveLlmModelQuery(hasLlmManagerApi);
  const settingsQuery = useLlmSettingsQuery(hasLlmManagerApi);

  const {
    downloadModel,
    selectModel,
    updateSettings,
    resetSettingsToDefaults,
    isDownloading,
    isSelecting,
    isSavingSettings,
    isResettingSettings,
    downloadError,
    selectError,
    settingsError
  } = useLlmManagerMutations();

  const catalogModels = catalogQuery.data ?? [];
  const downloadedModels = downloadedQuery.data ?? [];
  const activeModel = activeModelQuery.data ?? null;
  const settings = settingsQuery.data ?? null;
  const [progressByKey, setProgressByKey] = useState<Partial<Record<LlmModelKey, DownloadProgressView>>>({});

  useEffect(() => {
    const unsubscribe = subscribeToDownloadProgress((event) => {
      setProgressByKey((previous) => ({
        ...previous,
        [event.key]: { event }
      }));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (downloadedModels.length === 0) {
      return;
    }
    setProgressByKey((previous) => {
      const next = { ...previous };
      for (const downloaded of downloadedModels) {
        delete next[downloaded.key];
      }
      return next;
    });
  }, [downloadedModels]);

  const supportsDownload =
    typeof (window as Window & { api?: { llmManager?: { downloadModel?: unknown } } }).api?.llmManager?.downloadModel ===
    'function';

  const listErrorMessage = [catalogQuery.error, downloadedQuery.error, activeModelQuery.error, settingsQuery.error]
    .filter((error): error is Error => error instanceof Error)
    .map((error) => error.message)
    .join(' ');

  return (
    <div className="llm-manager" data-testid="llm-manager">
      {listErrorMessage ? <p className="llm-inline-error">{listErrorMessage}</p> : null}
      <div className="llm-manager-grid">
        <LlmDownload
          catalogModels={catalogModels}
          downloadedModels={downloadedModels}
          supportsDownload={supportsDownload}
          onDownload={downloadModel}
          isDownloading={isDownloading}
          progressByKey={progressByKey}
          errorMessage={downloadError}
        />
        <LlmSelector
          downloadedModels={downloadedModels}
          activeModelKey={activeModel?.key ?? null}
          isSelecting={isSelecting}
          onSelect={selectModel}
          errorMessage={selectError}
        />
        <LlmConfiguration
          settings={settings}
          canResetDefaults={Boolean(activeModel)}
          isSaving={isSavingSettings}
          isResetting={isResettingSettings}
          onSave={updateSettings}
          onResetDefaults={resetSettingsToDefaults}
          errorMessage={settingsError}
        />
      </div>
    </div>
  );
}
