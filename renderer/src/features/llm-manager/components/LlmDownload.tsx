import type { CatalogLlmModelDto, DownloadedLlmModelDto, LlmModelKey } from '../../../../../electron/shared/llmManagerContracts';

interface LlmDownloadProps {
  catalogModels: CatalogLlmModelDto[];
  downloadedModels: DownloadedLlmModelDto[];
  supportsDownload: boolean;
  onDownload: (key: LlmModelKey) => Promise<unknown>;
  isDownloading: boolean;
  errorMessage?: string;
}

export function LlmDownload({
  catalogModels,
  downloadedModels,
  supportsDownload,
  onDownload,
  isDownloading,
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
            return (
              <li key={model.key} className="llm-download-item">
                <div className="llm-download-meta">
                  <p className="llm-model-name">{model.displayName}</p>
                  <p className="llm-model-detail">{model.hfRepoId}</p>
                  <p className="llm-model-detail">{model.hfFilename}</p>
                </div>
                <button
                  type="button"
                  className="llm-action-button"
                  disabled={isDownloaded || isDownloading || !supportsDownload}
                  onClick={() => void onDownload(model.key)}
                  aria-label={`Download ${model.displayName}`}
                >
                  {isDownloaded ? 'Downloaded' : supportsDownload ? 'Download' : 'Download unavailable'}
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
