import type { AppError, AppResult } from '../../../../../electron/shared/appResult';
import type {
  CatalogLlmModelDto,
  DownloadModelRequest,
  DownloadModelResponse,
  DownloadProgressEvent,
  DownloadedLlmModelDto,
  GetActiveModelResponse,
  GetSettingsResponse,
  ListCatalogModelsResponse,
  ListDownloadedModelsResponse,
  LlmModelKey,
  LlmRuntimeSettings,
  ResetSettingsToDefaultsResponse,
  SelectModelRequest,
  SelectModelResponse,
  UpdateSettingsRequest,
  UpdateSettingsResponse
} from '../../../../../electron/shared/llmManagerContracts';

type LlmManagerApi = {
  listCatalogModels: () => Promise<AppResult<ListCatalogModelsResponse>>;
  listDownloadedModels: () => Promise<AppResult<ListDownloadedModelsResponse>>;
  getActiveModel: () => Promise<AppResult<GetActiveModelResponse>>;
  selectModel: (request: SelectModelRequest) => Promise<AppResult<SelectModelResponse>>;
  getSettings: () => Promise<AppResult<GetSettingsResponse>>;
  updateSettings: (request: UpdateSettingsRequest) => Promise<AppResult<UpdateSettingsResponse>>;
  resetSettingsToDefaults: () => Promise<AppResult<ResetSettingsToDefaultsResponse>>;
  downloadModel?: (request: DownloadModelRequest) => Promise<AppResult<DownloadModelResponse>>;
  onDownloadProgress?: (listener: (event: DownloadProgressEvent) => void) => () => void;
};

export const FALLBACK_CATALOG_MODELS: CatalogLlmModelDto[] = [
  {
    key: 'qwen3_4b_q8',
    displayName: 'Qwen3 4B Q8_0',
    hfRepoId: 'Qwen/Qwen3-4B-GGUF',
    hfFilename: 'Qwen3-4B-Q8_0.gguf',
    mmprojFilename: null,
    backend: 'server',
    modelFamily: 'instruct/think'
  },
  {
    key: 'qwen3_8b_q8',
    displayName: 'Qwen3 8B Q8_0',
    hfRepoId: 'Qwen/Qwen3-8B-GGUF',
    hfFilename: 'Qwen3-8B-Q8_0.gguf',
    mmprojFilename: null,
    backend: 'server',
    modelFamily: 'instruct/think'
  }
];

function toError(resultError: AppError): Error {
  return new Error(resultError.message || 'LLM manager request failed.');
}

function getLlmManagerApi(): LlmManagerApi {
  const appWindow = window as Window & { api?: { llmManager?: LlmManagerApi } };
  const llmApi = appWindow.api?.llmManager;
  if (!llmApi) {
    throw new Error('window.api.llmManager is not available.');
  }
  return llmApi;
}

function isApiUnavailableError(error: unknown): boolean {
  return error instanceof Error && error.message.toLowerCase().includes('not available');
}

export async function listCatalogModels(): Promise<CatalogLlmModelDto[]> {
  try {
    const llmApi = getLlmManagerApi();
    if (typeof llmApi.listCatalogModels !== 'function') {
      return FALLBACK_CATALOG_MODELS;
    }
    const result = await llmApi.listCatalogModels();
    if (!result.ok) {
      throw toError(result.error);
    }
    return result.data.models;
  } catch (error) {
    if (isApiUnavailableError(error)) {
      return FALLBACK_CATALOG_MODELS;
    }
    throw error;
  }
}

export async function listDownloadedModels(): Promise<DownloadedLlmModelDto[]> {
  const llmApi = getLlmManagerApi();
  const result = await llmApi.listDownloadedModels();
  if (!result.ok) {
    throw toError(result.error);
  }
  return result.data.models;
}

export async function getActiveModel(): Promise<DownloadedLlmModelDto | null> {
  const llmApi = getLlmManagerApi();
  const result = await llmApi.getActiveModel();
  if (!result.ok) {
    throw toError(result.error);
  }
  return result.data.model;
}

export async function selectModel(key: LlmModelKey): Promise<SelectModelResponse> {
  const llmApi = getLlmManagerApi();
  const result = await llmApi.selectModel({ key });
  if (!result.ok) {
    throw toError(result.error);
  }
  return result.data;
}

export async function getSettings(): Promise<LlmRuntimeSettings> {
  const llmApi = getLlmManagerApi();
  const result = await llmApi.getSettings();
  if (!result.ok) {
    throw toError(result.error);
  }
  return result.data.settings;
}

export async function updateSettings(settings: Partial<LlmRuntimeSettings>): Promise<LlmRuntimeSettings> {
  const llmApi = getLlmManagerApi();
  const result = await llmApi.updateSettings({ settings });
  if (!result.ok) {
    throw toError(result.error);
  }
  return result.data.settings;
}

export async function resetSettingsToDefaults(): Promise<ResetSettingsToDefaultsResponse> {
  const llmApi = getLlmManagerApi();
  const result = await llmApi.resetSettingsToDefaults();
  if (!result.ok) {
    throw toError(result.error);
  }
  return result.data;
}

export async function downloadModel(key: LlmModelKey): Promise<DownloadedLlmModelDto> {
  const llmApi = getLlmManagerApi();
  if (typeof llmApi.downloadModel !== 'function') {
    throw new Error('Model download action is not available in this build.');
  }

  const result = await llmApi.downloadModel({ key });
  if (!result.ok) {
    throw toError(result.error);
  }

  return result.data.model;
}

export function subscribeToDownloadProgress(listener: (event: DownloadProgressEvent) => void): () => void {
  const llmApi = getLlmManagerApi();
  if (typeof llmApi.onDownloadProgress !== 'function') {
    return () => {};
  }
  return llmApi.onDownloadProgress(listener);
}
