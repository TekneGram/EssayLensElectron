import { appErr, appOk } from '../../shared/appResult';
import type {
  ClearLlmSessionRequest,
  ClearLlmSessionResponse,
  CreateLlmSessionRequest,
  CreateLlmSessionResponse
} from '../../shared/llm-session';
import { LlmOrchestrator } from '../services/llmOrchestrator';
import type { LlmResponse } from '../services/llmOrchestrator';
import type { IpcMainLike } from './types';

export const LLM_SESSION_CHANNELS = {
  create: 'llmSession/create',
  clear: 'llmSession/clear'
} as const;

interface LlmSessionHandlerDeps {
  llmOrchestrator: Pick<LlmOrchestrator, 'requestAction'>;
}

function getDefaultDeps(): LlmSessionHandlerDeps {
  return {
    llmOrchestrator: new LlmOrchestrator()
  };
}

function normalizeSessionRequest(payload: unknown): { sessionId: string } | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }
  const candidate = payload as Record<string, unknown>;
  if (typeof candidate.sessionId !== 'string' || !candidate.sessionId.trim()) {
    return null;
  }
  return { sessionId: candidate.sessionId.trim() };
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCreateResponse(value: unknown): value is CreateLlmSessionResponse {
  return isObjectRecord(value) && typeof value.sessionId === 'string' && value.sessionId.trim().length > 0;
}

function isClearResponse(value: unknown): value is ClearLlmSessionResponse {
  return (
    isObjectRecord(value) &&
    typeof value.sessionId === 'string' &&
    value.sessionId.trim().length > 0 &&
    typeof value.cleared === 'boolean'
  );
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

export function registerLlmSessionHandlers(
  ipcMain: IpcMainLike,
  deps: LlmSessionHandlerDeps = getDefaultDeps()
): void {
  ipcMain.handle(LLM_SESSION_CHANNELS.create, async (_event, payload) => {
    const normalizedPayload = normalizeSessionRequest(payload);
    if (!normalizedPayload) {
      return appErr({
        code: 'LLM_SESSION_CREATE_INVALID_PAYLOAD',
        message: 'Create session payload must include a non-empty sessionId string.'
      });
    }

    const result = await deps.llmOrchestrator.requestAction<CreateLlmSessionRequest, CreateLlmSessionResponse>(
      'llm.session.create',
      normalizedPayload
    );
    const normalized = normalizeResult(result);
    if (!normalized.ok) {
      return appErr(normalized.error);
    }
    if (!isCreateResponse(normalized.data)) {
      return appErr({
        code: 'LLM_SESSION_CREATE_INVALID_RESPONSE',
        message: 'Python worker returned invalid session create payload.',
        details: normalized.data
      });
    }
    return appOk<CreateLlmSessionResponse>(normalized.data);
  });

  ipcMain.handle(LLM_SESSION_CHANNELS.clear, async (_event, payload) => {
    const normalizedPayload = normalizeSessionRequest(payload);
    if (!normalizedPayload) {
      return appErr({
        code: 'LLM_SESSION_CLEAR_INVALID_PAYLOAD',
        message: 'Clear session payload must include a non-empty sessionId string.'
      });
    }

    const result = await deps.llmOrchestrator.requestAction<ClearLlmSessionRequest, ClearLlmSessionResponse>(
      'llm.session.clear',
      normalizedPayload
    );
    const normalized = normalizeResult(result);
    if (!normalized.ok) {
      return appErr(normalized.error);
    }
    if (!isClearResponse(normalized.data)) {
      return appErr({
        code: 'LLM_SESSION_CLEAR_INVALID_RESPONSE',
        message: 'Python worker returned invalid session clear payload.',
        details: normalized.data
      });
    }
    return appOk<ClearLlmSessionResponse>(normalized.data);
  });
}
