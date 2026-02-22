import type {
  CatalogLlmModelDto,
  DownloadedLlmModelDto,
  DownloadProgressEvent,
  LlmModelKey
} from '../../../../../electron/shared/llmManagerContracts';

interface DownloadProgressView {
  event: DownloadProgressEvent;
}

interface LlmDownloadProps {
  catalogModels: CatalogLlmModelDto[];
  downloadedModels: DownloadedLlmModelDto[];
  supportsDownload: boolean;
  onDownload: (key: LlmModelKey) => Promise<unknown>;
  isDownloading: boolean;
  progressByKey: Partial<Record<LlmModelKey, DownloadProgressView>>;
  errorMessage?: string;
}

export function LlmDownload({
  catalogModels,
  downloadedModels,
  supportsDownload,
  onDownload,
  isDownloading,
  progressByKey,
  errorMessage
}: LlmDownloadProps) {
  const downloadedKeys = new Set(downloadedModels.map((model) => model.key));

  return (
    <section className="subpane llm-panel" aria-label="LLM download manager" data-testid="llm-download">
      <h4>LlmDownload</h4>
      <div className="content-block llm-section-content">
        <ul className="llm-download-list" aria-label="Available models">
          {catalogModels.map((model) => {
            const isDownloaded = downloadedKeys.has(model.key);
            const progress = progressByKey[model.key]?.event;
            const isInProgress = Boolean(progress && (progress.phase === 'starting' || progress.phase === 'downloading' || progress.phase === 'persisting'));
            const showProgress = Boolean(progress) && !isDownloaded;
            const progressValue = progress?.percent ?? undefined;
            const progressMax = progress?.percent === null ? undefined : 100;
            return (
              <li key={model.key} className="llm-download-item">
                <div className="llm-download-meta">
                  <p className="llm-model-name">{model.displayName}</p>
                  <p className="llm-model-detail">{model.hfRepoId}</p>
                  <p className="llm-model-detail">{model.hfFilename}</p>
                  {showProgress ? (
                    <div className="llm-download-progress" aria-live="polite">
                      <p className="llm-model-detail llm-progress-status">{progress?.status}</p>
                      {progress?.percent === null ? (
                        <div className="llm-progress-indeterminate" role="progressbar" aria-label={`Downloading ${model.displayName}`} />
                      ) : (
                        <progress
                          className="llm-progress-bar"
                          max={progressMax}
                          value={progressValue}
                          aria-label={`Downloading ${model.displayName}`}
                        />
                      )}
                      <p className="llm-model-detail">
                        {progress?.percent === null
                          ? `${progress?.bytesReceived ?? 0} bytes`
                          : `${progress?.percent ?? 0}%`}
                      </p>
                      {progress?.errorMessage ? <p className="llm-inline-error">{progress.errorMessage}</p> : null}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="llm-action-button"
                  disabled={isDownloaded || isDownloading || isInProgress || !supportsDownload}
                  onClick={() => void onDownload(model.key)}
                  aria-label={`Download ${model.displayName}`}
                >
                  {isDownloaded ? 'Downloaded' : isInProgress ? 'Downloading...' : supportsDownload ? 'Download' : 'Download unavailable'}
                </button>
              </li>
            );
          })}
        </ul>
        {errorMessage ? <p className="llm-inline-error">{errorMessage}</p> : null}
      </div>
    </section>
  );
}
