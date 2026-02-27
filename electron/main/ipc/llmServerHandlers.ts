import { appErr, appOk } from '../../shared/appResult';
import type {
  GetLlmServerStatusResponse,
  StartLlmServerResponse,
  StopLlmServerResponse
} from '../../shared/llm-server';
import type { LlmRuntimeSettings } from '../../shared/llmManagerContracts';
import { LlmSettingsRepository } from '../db/repositories/llmSettingsRepository';
import { LlmOrchestrator } from '../services/llmOrchestrator';
import type { LlmResponse } from '../services/llmOrchestrator';
import type { IpcMainLike } from './types';

export const LLM_SERVER_CHANNELS = {
  start: 'llmServer/start',
  stop: 'llmServer/stop',
  status: 'llmServer/status'
} as const;

interface LlmServerHandlerDeps {
  llmOrchestrator: Pick<LlmOrchestrator, 'requestAction'>;
  llmSettingsRepository: Pick<LlmSettingsRepository, 'getRuntimeSettings'>;
}

function getDefaultDeps(): LlmServerHandlerDeps {
  return {
    llmOrchestrator: new LlmOrchestrator(),
    llmSettingsRepository: new LlmSettingsRepository()
  };
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStartResponse(value: unknown): value is StartLlmServerResponse {
  if (!isObjectRecord(value)) {
    return false;
  }
  return (
    typeof value.warmed === 'boolean' &&
    typeof value.fakeMode === 'boolean' &&
    typeof value.serverRunning === 'boolean'
  );
}

function isStopResponse(value: unknown): value is StopLlmServerResponse {
  if (!isObjectRecord(value)) {
    return false;
  }
  return (
    typeof value.stopped === 'boolean' &&
    typeof value.hasRuntime === 'boolean' &&
    typeof value.serverRunning === 'boolean'
  );
}

function isStatusResponse(value: unknown): value is GetLlmServerStatusResponse {
  if (!isObjectRecord(value)) {
    return false;
  }
  if (value.runtimeKey !== null && !Array.isArray(value.runtimeKey)) {
    return false;
  }
  return typeof value.hasRuntime === 'boolean' && typeof value.serverRunning === 'boolean';
}

function normalizeResult<T>(
  result: LlmResponse<T>
): { ok: true; data: T } | { ok: false; error: { code: string; message: string; details?: unknown } } {
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return {
    ok: true,
    data: result.data
  };
}

export function registerLlmServerHandlers(
  ipcMain: IpcMainLike,
  deps: LlmServerHandlerDeps = getDefaultDeps()
): void {
  ipcMain.handle(LLM_SERVER_CHANNELS.start, async () => {
    let settings: LlmRuntimeSettings;
    try {
      settings = await deps.llmSettingsRepository.getRuntimeSettings();
    } catch (error) {
      return appErr({
        code: 'LLM_SERVER_SETTINGS_LOAD_FAILED',
        message: 'Could not load LLM runtime settings.',
        details: error
      });
    }

    const result = await deps.llmOrchestrator.requestAction<{ settings: LlmRuntimeSettings }, StartLlmServerResponse>(
      'llm.server.start',
      { settings }
    );
    const normalized = normalizeResult(result);
    if (!normalized.ok) {
      return appErr(normalized.error);
    }
    if (!isStartResponse(normalized.data)) {
      return appErr({
        code: 'LLM_SERVER_START_INVALID_RESPONSE',
        message: 'Python worker returned invalid start payload.',
        details: normalized.data
      });
    }
    return appOk<StartLlmServerResponse>(normalized.data);
  });

  ipcMain.handle(LLM_SERVER_CHANNELS.stop, async () => {
    const result = await deps.llmOrchestrator.requestAction<{}, StopLlmServerResponse>('llm.server.stop', {});
    const normalized = normalizeResult(result);
    if (!normalized.ok) {
      return appErr(normalized.error);
    }
    if (!isStopResponse(normalized.data)) {
      return appErr({
        code: 'LLM_SERVER_STOP_INVALID_RESPONSE',
        message: 'Python worker returned invalid stop payload.',
        details: normalized.data
      });
    }
    return appOk<StopLlmServerResponse>(normalized.data);
  });

  ipcMain.handle(LLM_SERVER_CHANNELS.status, async () => {
    const result = await deps.llmOrchestrator.requestAction<{}, GetLlmServerStatusResponse>('llm.server.status', {});
    const normalized = normalizeResult(result);
    if (!normalized.ok) {
      return appErr(normalized.error);
    }
    if (!isStatusResponse(normalized.data)) {
      return appErr({
        code: 'LLM_SERVER_STATUS_INVALID_RESPONSE',
        message: 'Python worker returned invalid status payload.',
        details: normalized.data
      });
    }
    return appOk<GetLlmServerStatusResponse>(normalized.data);
  });
}
