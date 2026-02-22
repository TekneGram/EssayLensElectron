import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { appErr, appOk } from '../../shared/appResult';
import type {
  DeleteDownloadedModelRequest,
  DeleteDownloadedModelResponse,
  DownloadModelRequest,
  DownloadProgressEvent,
  DownloadModelResponse,
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
} from '../../shared/llmManagerContracts';
import { LlmSelectionRepository } from '../db/repositories/llmSelectionRepository';
import { LlmSettingsRepository } from '../db/repositories/llmSettingsRepository';
import { downloadModelFile } from '../services/llmModelDownloader';
import { resolveLlamaServerPath } from '../services/llmRuntimePaths';
import type { IpcMainLike } from './types';

export const LLM_MANAGER_CHANNELS = {
  listCatalogModels: 'llmManager/listCatalogModels',
  listDownloadedModels: 'llmManager/listDownloadedModels',
  getActiveModel: 'llmManager/getActiveModel',
  downloadModel: 'llmManager/downloadModel',
  deleteDownloadedModel: 'llmManager/deleteDownloadedModel',
  selectModel: 'llmManager/selectModel',
  getSettings: 'llmManager/getSettings',
  updateSettings: 'llmManager/updateSettings',
  resetSettingsToDefaults: 'llmManager/resetSettingsToDefaults'
} as const;

export const LLM_MANAGER_EVENTS = {
  downloadProgress: 'llmManager/downloadProgress'
} as const;

interface LlmManagerHandlerDeps {
  selectionRepository: Pick<
    LlmSelectionRepository,
    | 'listCatalogModels'
    | 'listDownloadedModels'
    | 'getActiveModel'
    | 'selectModel'
    | 'resetSettingsToDefaults'
    | 'upsertDownloadedModel'
    | 'getDownloadedModelByKey'
    | 'deleteDownloadedModel'
  >;
  settingsRepository: Pick<LlmSettingsRepository, 'getRuntimeSettings' | 'updateRuntimeSettings'>;
  downloadModel: (request: {
    key: LlmModelKey;
    hfRepoId: string;
    hfFilename: string;
    onProgress?: (event: DownloadProgressEvent) => void;
  }) => Promise<string>;
  fileExists?: (targetPath: string) => Promise<boolean>;
  removePath?: (targetPath: string) => Promise<void>;
  resolveLlmServerPath?: () => string;
}

const VALID_MODEL_KEYS: ReadonlySet<LlmModelKey> = new Set(['qwen3_4b_q8', 'qwen3_8b_q8']);
const RUNTIME_SETTINGS_SCHEMA: Record<keyof LlmRuntimeSettings, 'string' | 'number' | 'boolean' | 'nullable-string' | 'nullable-number'> =
  {
    llm_server_path: 'string',
    llm_gguf_path: 'nullable-string',
    llm_mmproj_path: 'nullable-string',
    llm_server_url: 'string',
    llm_host: 'string',
    llm_port: 'number',
    llm_n_ctx: 'number',
    llm_n_threads: 'nullable-number',
    llm_n_gpu_layers: 'nullable-number',
    llm_n_batch: 'nullable-number',
    llm_n_parallel: 'nullable-number',
    llm_seed: 'nullable-number',
    llm_rope_freq_base: 'nullable-number',
    llm_rope_freq_scale: 'nullable-number',
    llm_use_jinja: 'boolean',
    llm_cache_prompt: 'boolean',
    llm_flash_attn: 'boolean',
    max_tokens: 'number',
    temperature: 'number',
    top_p: 'nullable-number',
    top_k: 'nullable-number',
    repeat_penalty: 'nullable-number',
    request_seed: 'nullable-number',
    use_fake_reply: 'boolean',
    fake_reply_text: 'nullable-string'
  };

function resolveDefaultLlmServerPath(): string {
  const runtimeMode = process.env.VITE_DEV_SERVER_URL || process.env.NODE_ENV === 'development' ? 'dev' : 'packaged';
  return resolveLlamaServerPath({ mode: runtimeMode });
}

function getDefaultDeps(): LlmManagerHandlerDeps {
  const selectionRepository = new LlmSelectionRepository();
  return {
    selectionRepository,
    settingsRepository: new LlmSettingsRepository(),
    downloadModel: downloadModelFile,
    fileExists: defaultFileExists,
    removePath: defaultRemovePath,
    resolveLlmServerPath: resolveDefaultLlmServerPath
  };
}

async function defaultFileExists(targetPath: string): Promise<boolean> {
  try {
    await fsPromises.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function defaultRemovePath(targetPath: string): Promise<void> {
  await fsPromises.rm(targetPath, { recursive: true, force: true });
}

function normalizeModelRequest(payload: unknown): { key: LlmModelKey } | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }
  const candidate = payload as Record<string, unknown>;
  if (typeof candidate.key !== 'string' || !VALID_MODEL_KEYS.has(candidate.key as LlmModelKey)) {
    return null;
  }
  return { key: candidate.key as LlmModelKey };
}

function normalizeSelectModelRequest(payload: unknown): SelectModelRequest | null {
  return normalizeModelRequest(payload);
}

function normalizeDownloadModelRequest(payload: unknown): DownloadModelRequest | null {
  return normalizeModelRequest(payload);
}

function normalizeDeleteDownloadedModelRequest(payload: unknown): DeleteDownloadedModelRequest | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }
  const candidate = payload as Record<string, unknown>;
  const keyPayload = normalizeModelRequest(payload);
  if (!keyPayload) {
    return null;
  }
  if ('deleteFiles' in candidate && typeof candidate.deleteFiles !== 'boolean') {
    return null;
  }
  return {
    key: keyPayload.key,
    deleteFiles: candidate.deleteFiles === undefined ? true : (candidate.deleteFiles as boolean)
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeUpdateSettingsRequest(payload: unknown): UpdateSettingsRequest | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }
  const candidate = payload as Record<string, unknown>;
  if (typeof candidate.settings !== 'object' || candidate.settings === null) {
    return null;
  }

  const settings = candidate.settings as Record<string, unknown>;
  const normalized: Partial<LlmRuntimeSettings> = {};
  const normalizedMutable = normalized as Record<string, unknown>;
  for (const [key, value] of Object.entries(settings)) {
    if (!(key in RUNTIME_SETTINGS_SCHEMA)) {
      return null;
    }

    const field = key as keyof LlmRuntimeSettings;
    const rule = RUNTIME_SETTINGS_SCHEMA[field];
    switch (rule) {
      case 'string':
        if (typeof value !== 'string') {
          return null;
        }
        normalizedMutable[field] = value;
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return null;
        }
        normalizedMutable[field] = value;
        break;
      case 'number':
        if (!isFiniteNumber(value)) {
          return null;
        }
        normalizedMutable[field] = value;
        break;
      case 'nullable-string':
        if (value !== null && typeof value !== 'string') {
          return null;
        }
        normalizedMutable[field] = value;
        break;
      case 'nullable-number':
        if (value !== null && !isFiniteNumber(value)) {
          return null;
        }
        normalizedMutable[field] = value;
        break;
      default:
        return null;
    }
  }

  return { settings: normalized };
}

export function registerLlmManagerHandlers(ipcMain: IpcMainLike, deps: LlmManagerHandlerDeps = getDefaultDeps()): void {
  const fileExists = deps.fileExists ?? defaultFileExists;
  const removePath = deps.removePath ?? defaultRemovePath;

  const emitDownloadProgress = (event: unknown, payload: DownloadProgressEvent): void => {
    const sender =
      typeof event === 'object' && event !== null && 'sender' in event
        ? (event as { sender?: { send?: (channel: string, body: unknown) => void } }).sender
        : undefined;
    if (sender && typeof sender.send === 'function') {
      sender.send(LLM_MANAGER_EVENTS.downloadProgress, payload);
    }
  };

  const clearRuntimeModelPaths = async (): Promise<void> => {
    await deps.settingsRepository.updateRuntimeSettings({
      llm_gguf_path: null,
      llm_mmproj_path: null
    });
  };

  const reconcileDownloadedModels = async (): Promise<void> => {
    const downloadedResponse = await deps.selectionRepository.listDownloadedModels();
    const downloaded = Array.isArray(downloadedResponse) ? downloadedResponse : [];
    for (const model of downloaded) {
      const ggufExists = await fileExists(model.localGgufPath);
      const mmprojExists =
        model.localMmprojPath === null ? true : await fileExists(model.localMmprojPath);
      if (ggufExists && mmprojExists) {
        continue;
      }

      const removed = await deps.selectionRepository.deleteDownloadedModel(model.key);
      if (removed?.isActive) {
        await clearRuntimeModelPaths();
      }
    }
  };

  ipcMain.handle(LLM_MANAGER_CHANNELS.listCatalogModels, async () => {
    try {
      const models = await deps.selectionRepository.listCatalogModels();
      return appOk<ListCatalogModelsResponse>({ models });
    } catch (error) {
      return appErr({
        code: 'LLM_MANAGER_LIST_CATALOG_FAILED',
        message: 'Could not load LLM catalog models.',
        details: error
      });
    }
  });

  ipcMain.handle(LLM_MANAGER_CHANNELS.listDownloadedModels, async () => {
    try {
      await reconcileDownloadedModels();
      const models = await deps.selectionRepository.listDownloadedModels();
      return appOk<ListDownloadedModelsResponse>({ models });
    } catch (error) {
      return appErr({
        code: 'LLM_MANAGER_LIST_DOWNLOADED_FAILED',
        message: 'Could not load downloaded LLM models.',
        details: error
      });
    }
  });

  ipcMain.handle(LLM_MANAGER_CHANNELS.getActiveModel, async () => {
    try {
      await reconcileDownloadedModels();
      const model = await deps.selectionRepository.getActiveModel();
      return appOk<GetActiveModelResponse>({ model });
    } catch (error) {
      return appErr({
        code: 'LLM_MANAGER_GET_ACTIVE_FAILED',
        message: 'Could not load active LLM model.',
        details: error
      });
    }
  });

  ipcMain.handle(LLM_MANAGER_CHANNELS.deleteDownloadedModel, async (_event, payload) => {
    const request = normalizeDeleteDownloadedModelRequest(payload);
    if (!request) {
      return appErr({
        code: 'LLM_MANAGER_DELETE_INVALID_PAYLOAD',
        message: 'Delete model payload must include a supported model key.'
      });
    }

    const existing = await deps.selectionRepository.getDownloadedModelByKey(request.key);
    if (!existing) {
      return appErr({
        code: 'LLM_MANAGER_DELETE_MODEL_NOT_FOUND',
        message: 'The selected model is not currently downloaded.'
      });
    }

    let removedFromDisk = false;
    if (request.deleteFiles !== false) {
      try {
        await removePath(existing.localGgufPath);
        if (existing.localMmprojPath) {
          await removePath(existing.localMmprojPath);
        }
        await removePath(path.dirname(existing.localGgufPath));
        removedFromDisk = true;
      } catch (error) {
        return appErr({
          code: 'LLM_MANAGER_DELETE_FILE_REMOVE_FAILED',
          message: 'Could not remove model files from disk.',
          details: error
        });
      }
    }

    try {
      const deleted = await deps.selectionRepository.deleteDownloadedModel(request.key);
      if (!deleted) {
        return appErr({
          code: 'LLM_MANAGER_DELETE_MODEL_NOT_FOUND',
          message: 'The selected model is not currently downloaded.'
        });
      }
      if (deleted.isActive) {
        await clearRuntimeModelPaths();
      }
      return appOk<DeleteDownloadedModelResponse>({
        deletedKey: request.key,
        removedFromDisk
      });
    } catch (error) {
      return appErr({
        code: 'LLM_MANAGER_DELETE_PERSIST_FAILED',
        message: 'Could not remove downloaded model from the database.',
        details: error
      });
    }
  });

  ipcMain.handle(LLM_MANAGER_CHANNELS.downloadModel, async (event, payload) => {
    const request = normalizeDownloadModelRequest(payload);
    if (!request) {
      return appErr({
        code: 'LLM_MANAGER_DOWNLOAD_INVALID_PAYLOAD',
        message: 'Download model payload must include a supported model key.'
      });
    }

    let catalogModel: Awaited<ReturnType<typeof deps.selectionRepository.listCatalogModels>>[number] | undefined;
    try {
      const catalogModels = await deps.selectionRepository.listCatalogModels();
      catalogModel = catalogModels.find((model) => model.key === request.key);
    } catch (error) {
      return appErr({
        code: 'LLM_MANAGER_LIST_CATALOG_FAILED',
        message: 'Could not load LLM catalog models.',
        details: error
      });
    }

    if (!catalogModel) {
      return appErr({
        code: 'LLM_MANAGER_DOWNLOAD_MODEL_NOT_FOUND',
        message: 'The requested model key does not exist in the LLM catalog.'
      });
    }

    let localGgufPath: string;
    try {
      localGgufPath = await deps.downloadModel({
        key: catalogModel.key,
        hfRepoId: catalogModel.hfRepoId,
        hfFilename: catalogModel.hfFilename,
        onProgress: (progressEvent) => emitDownloadProgress(event, progressEvent)
      });
    } catch (error) {
      emitDownloadProgress(event, {
        key: catalogModel.key,
        phase: 'failed',
        bytesReceived: 0,
        bytesTotal: null,
        percent: null,
        status: 'Download failed',
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      return appErr({
        code: 'LLM_MANAGER_DOWNLOAD_FAILED',
        message: 'Could not download the selected LLM model.',
        details: error
      });
    }

    try {
      emitDownloadProgress(event, {
        key: catalogModel.key,
        phase: 'persisting',
        bytesReceived: 0,
        bytesTotal: null,
        percent: null,
        status: 'Persisting model metadata',
        errorMessage: null
      });
      const model = await deps.selectionRepository.upsertDownloadedModel({
        key: catalogModel.key,
        displayName: catalogModel.displayName,
        localGgufPath,
        localMmprojPath: null
      });
      emitDownloadProgress(event, {
        key: catalogModel.key,
        phase: 'completed',
        bytesReceived: 0,
        bytesTotal: null,
        percent: 100,
        status: 'Model ready',
        errorMessage: null
      });
      return appOk<DownloadModelResponse>({ model });
    } catch (error) {
      emitDownloadProgress(event, {
        key: catalogModel.key,
        phase: 'failed',
        bytesReceived: 0,
        bytesTotal: null,
        percent: null,
        status: 'Persist failed',
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      return appErr({
        code: 'LLM_MANAGER_DOWNLOAD_PERSIST_FAILED',
        message: 'Model download succeeded but could not be persisted.',
        details: error
      });
    }
  });

  ipcMain.handle(LLM_MANAGER_CHANNELS.selectModel, async (_event, payload) => {
    const request = normalizeSelectModelRequest(payload);
    if (!request) {
      return appErr({
        code: 'LLM_MANAGER_SELECT_INVALID_PAYLOAD',
        message: 'Select model payload must include a supported model key.'
      });
    }

    try {
      await reconcileDownloadedModels();
      const llmServerPath = (deps.resolveLlmServerPath ?? resolveDefaultLlmServerPath)();
      const selected = await deps.selectionRepository.selectModel(request.key, llmServerPath);
      if (!selected) {
        return appErr({
          code: 'LLM_MANAGER_SELECT_MODEL_NOT_DOWNLOADED',
          message: 'The selected model is not downloaded and cannot be activated.'
        });
      }

      return appOk<SelectModelResponse>(selected);
    } catch (error) {
      return appErr({
        code: 'LLM_MANAGER_SELECT_FAILED',
        message: 'Could not activate the selected LLM model.',
        details: error
      });
    }
  });

  ipcMain.handle(LLM_MANAGER_CHANNELS.getSettings, async () => {
    try {
      const settings = await deps.settingsRepository.getRuntimeSettings();
      return appOk<GetSettingsResponse>({ settings });
    } catch (error) {
      return appErr({
        code: 'LLM_MANAGER_GET_SETTINGS_FAILED',
        message: 'Could not load LLM runtime settings.',
        details: error
      });
    }
  });

  ipcMain.handle(LLM_MANAGER_CHANNELS.updateSettings, async (_event, payload) => {
    const request = normalizeUpdateSettingsRequest(payload);
    if (!request) {
      return appErr({
        code: 'LLM_MANAGER_UPDATE_SETTINGS_INVALID_PAYLOAD',
        message: 'Update settings payload must include a valid settings object.'
      });
    }

    try {
      const settings = await deps.settingsRepository.updateRuntimeSettings(request.settings);
      return appOk<UpdateSettingsResponse>({ settings });
    } catch (error) {
      return appErr({
        code: 'LLM_MANAGER_UPDATE_SETTINGS_FAILED',
        message: 'Could not update LLM runtime settings.',
        details: error
      });
    }
  });

  ipcMain.handle(LLM_MANAGER_CHANNELS.resetSettingsToDefaults, async () => {
    try {
      const llmServerPath = (deps.resolveLlmServerPath ?? resolveDefaultLlmServerPath)();
      const reset = await deps.selectionRepository.resetSettingsToDefaults(llmServerPath);
      if (!reset) {
        return appErr({
          code: 'LLM_MANAGER_RESET_NO_ACTIVE_MODEL',
          message: 'No active model is selected to reset settings from defaults.'
        });
      }
      return appOk<ResetSettingsToDefaultsResponse>(reset);
    } catch (error) {
      return appErr({
        code: 'LLM_MANAGER_RESET_SETTINGS_FAILED',
        message: 'Could not reset LLM settings to model defaults.',
        details: error
      });
    }
  });
}
