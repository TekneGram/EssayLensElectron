import type { AppResult } from '../../../electron/shared/appResult';
import type {
  DeleteDownloadedModelRequest,
  DeleteDownloadedModelResponse,
  DownloadModelRequest,
  DownloadModelResponse,
  DownloadProgressEvent,
  GetActiveModelResponse,
  GetSettingsResponse,
  ListCatalogModelsResponse,
  ListDownloadedModelsResponse,
  ResetSettingsToDefaultsResponse,
  SelectModelRequest,
  SelectModelResponse,
  UpdateSettingsRequest,
  UpdateSettingsResponse
} from '../../../electron/shared/llmManagerContracts';

export interface LlmManagerPort {
  isAvailable(): boolean;
  supportsDownload(): boolean;
  listCatalogModels(): Promise<AppResult<ListCatalogModelsResponse>>;
  listDownloadedModels(): Promise<AppResult<ListDownloadedModelsResponse>>;
  getActiveModel(): Promise<AppResult<GetActiveModelResponse>>;
  downloadModel(request: DownloadModelRequest): Promise<AppResult<DownloadModelResponse>>;
  deleteDownloadedModel(request: DeleteDownloadedModelRequest): Promise<AppResult<DeleteDownloadedModelResponse>>;
  onDownloadProgress(listener: (event: DownloadProgressEvent) => void): () => void;
  selectModel(request: SelectModelRequest): Promise<AppResult<SelectModelResponse>>;
  getSettings(): Promise<AppResult<GetSettingsResponse>>;
  updateSettings(request: UpdateSettingsRequest): Promise<AppResult<UpdateSettingsResponse>>;
  resetSettingsToDefaults(): Promise<AppResult<ResetSettingsToDefaultsResponse>>;
}
