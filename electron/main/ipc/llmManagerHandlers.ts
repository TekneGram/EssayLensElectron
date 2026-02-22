import { appErr, appOk } from '../../shared/appResult';
import type {
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
import type { IpcMainLike } from './types';

export const LLM_MANAGER_CHANNELS = {
  listCatalogModels: 'llmManager/listCatalogModels',
  listDownloadedModels: 'llmManager/listDownloadedModels',
  getActiveModel: 'llmManager/getActiveModel',
  selectModel: 'llmManager/selectModel',
  getSettings: 'llmManager/getSettings',
  updateSettings: 'llmManager/updateSettings',
  resetSettingsToDefaults: 'llmManager/resetSettingsToDefaults'
} as const;

interface LlmManagerHandlerDeps {
  selectionRepository: Pick<
    LlmSelectionRepository,
    'listCatalogModels' | 'listDownloadedModels' | 'getActiveModel' | 'selectModel' | 'resetSettingsToDefaults'
  >;
  settingsRepository: Pick<LlmSettingsRepository, 'getRuntimeSettings' | 'updateRuntimeSettings'>;
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

function getDefaultDeps(): LlmManagerHandlerDeps {
  const selectionRepository = new LlmSelectionRepository();
  return {
    selectionRepository,
    settingsRepository: new LlmSettingsRepository()
  };
}

function normalizeSelectModelRequest(payload: unknown): SelectModelRequest | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }
  const candidate = payload as Record<string, unknown>;
  if (typeof candidate.key !== 'string' || !VALID_MODEL_KEYS.has(candidate.key as LlmModelKey)) {
    return null;
  }
  return { key: candidate.key as LlmModelKey };
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

  ipcMain.handle(LLM_MANAGER_CHANNELS.selectModel, async (_event, payload) => {
    const request = normalizeSelectModelRequest(payload);
    if (!request) {
      return appErr({
        code: 'LLM_MANAGER_SELECT_INVALID_PAYLOAD',
        message: 'Select model payload must include a supported model key.'
      });
    }

    try {
      const selected = await deps.selectionRepository.selectModel(request.key);
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
      const reset = await deps.selectionRepository.resetSettingsToDefaults();
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
