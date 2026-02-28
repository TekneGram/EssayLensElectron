import type {
  CatalogLlmModelDto,
  DownloadProgressEvent,
  DownloadedLlmModelDto,
  LlmModelKey,
  LlmRuntimeSettings
} from '../../../../../electron/shared/llmManagerContracts';

export type LlmCatalogModel = CatalogLlmModelDto;
export type LlmDownloadedModel = DownloadedLlmModelDto;
export type LlmSettings = LlmRuntimeSettings;
export type LlmDownloadProgress = DownloadProgressEvent;
export type LlmKey = LlmModelKey;

export interface DownloadProgressView {
  event: LlmDownloadProgress;
}
