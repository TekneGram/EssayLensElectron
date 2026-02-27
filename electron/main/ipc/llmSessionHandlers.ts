import { appErr, appOk } from '../../shared/appResult';
import type {
  ClearLlmSessionResponse,
  CreateLlmSessionResponse,
  GetLlmSessionTurnsResponse,
  LlmSessionTurnDto
} from '../../shared/llm-session';
import { LlmChatSessionRepository } from '../db/repositories/llmChatSessionRepository';
import type { IpcMainLike } from './types';

export const LLM_SESSION_CHANNELS = {
  create: 'llmSession/create',
  clear: 'llmSession/clear',
  getTurns: 'llmSession/getTurns'
} as const;

interface LlmSessionHandlerDeps {
  llmChatSessionRepository: Pick<LlmChatSessionRepository, 'createSession' | 'clearSession' | 'listRecentTurns'>;
}

function getDefaultDeps(): LlmSessionHandlerDeps {
  return {
    llmChatSessionRepository: new LlmChatSessionRepository()
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

function normalizeSessionFileRequest(payload: unknown): { sessionId: string; fileEntityUuid: string } | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }
  const candidate = payload as Record<string, unknown>;
  if (typeof candidate.sessionId !== 'string' || !candidate.sessionId.trim()) {
    return null;
  }
  if (typeof candidate.fileEntityUuid !== 'string' || !candidate.fileEntityUuid.trim()) {
    return null;
  }
  return {
    sessionId: candidate.sessionId.trim(),
    fileEntityUuid: candidate.fileEntityUuid.trim()
  };
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCreateResponse(value: unknown): value is CreateLlmSessionResponse {
  return (
    isObjectRecord(value) &&
    typeof value.sessionId === 'string' &&
    value.sessionId.trim().length > 0 &&
    typeof value.fileEntityUuid === 'string' &&
    value.fileEntityUuid.trim().length > 0
  );
}

function isClearResponse(value: unknown): value is ClearLlmSessionResponse {
  return (
    isObjectRecord(value) &&
    typeof value.sessionId === 'string' &&
    value.sessionId.trim().length > 0 &&
    typeof value.cleared === 'boolean'
  );
}

function isTurnsResponse(value: unknown): value is GetLlmSessionTurnsResponse {
  if (!isObjectRecord(value)) {
    return false;
  }
  if (
    typeof value.sessionId !== 'string' ||
    !value.sessionId.trim() ||
    typeof value.fileEntityUuid !== 'string' ||
    !value.fileEntityUuid.trim() ||
    !Array.isArray(value.turns)
  ) {
    return false;
  }
  return value.turns.every(
    (turn): turn is LlmSessionTurnDto =>
      isObjectRecord(turn) &&
      (turn.role === 'teacher' || turn.role === 'assistant' || turn.role === 'system') &&
      typeof turn.content === 'string'
  );
}

export function registerLlmSessionHandlers(
  ipcMain: IpcMainLike,
  deps: LlmSessionHandlerDeps = getDefaultDeps()
): void {
  ipcMain.handle(LLM_SESSION_CHANNELS.create, async (_event, payload) => {
    const normalizedPayload = normalizeSessionFileRequest(payload);
    if (!normalizedPayload) {
      return appErr({
        code: 'LLM_SESSION_CREATE_INVALID_PAYLOAD',
        message: 'Create session payload must include non-empty sessionId and fileEntityUuid strings.'
      });
    }

    try {
      const created = await deps.llmChatSessionRepository.createSession(
        normalizedPayload.sessionId,
        normalizedPayload.fileEntityUuid
      );
      if (!isCreateResponse(created)) {
        return appErr({
          code: 'LLM_SESSION_CREATE_INVALID_RESPONSE',
          message: 'Session repository returned invalid create payload.',
          details: created
        });
      }
      return appOk<CreateLlmSessionResponse>(created);
    } catch (error) {
      return appErr({
        code: 'LLM_SESSION_CREATE_FAILED',
        message: 'Could not create chat session.',
        details: error
      });
    }
  });

  ipcMain.handle(LLM_SESSION_CHANNELS.clear, async (_event, payload) => {
    const normalizedPayload = normalizeSessionRequest(payload);
    if (!normalizedPayload) {
      return appErr({
        code: 'LLM_SESSION_CLEAR_INVALID_PAYLOAD',
        message: 'Clear session payload must include a non-empty sessionId string.'
      });
    }

    try {
      const cleared = await deps.llmChatSessionRepository.clearSession(normalizedPayload.sessionId);
      if (!isClearResponse(cleared)) {
        return appErr({
          code: 'LLM_SESSION_CLEAR_INVALID_RESPONSE',
          message: 'Session repository returned invalid clear payload.',
          details: cleared
        });
      }
      return appOk<ClearLlmSessionResponse>(cleared);
    } catch (error) {
      return appErr({
        code: 'LLM_SESSION_CLEAR_FAILED',
        message: 'Could not clear chat session.',
        details: error
      });
    }
  });

  ipcMain.handle(LLM_SESSION_CHANNELS.getTurns, async (_event, payload) => {
    const normalizedPayload = normalizeSessionFileRequest(payload);
    if (!normalizedPayload) {
      return appErr({
        code: 'LLM_SESSION_GET_TURNS_INVALID_PAYLOAD',
        message: 'Get turns payload must include non-empty sessionId and fileEntityUuid strings.'
      });
    }

    try {
      const turns = await deps.llmChatSessionRepository.listRecentTurns(
        normalizedPayload.sessionId,
        normalizedPayload.fileEntityUuid
      );
      const response: GetLlmSessionTurnsResponse = {
        sessionId: normalizedPayload.sessionId,
        fileEntityUuid: normalizedPayload.fileEntityUuid,
        turns
      };
      if (!isTurnsResponse(response)) {
        return appErr({
          code: 'LLM_SESSION_GET_TURNS_INVALID_RESPONSE',
          message: 'Session repository returned invalid turns payload.',
          details: response
        });
      }
      return appOk<GetLlmSessionTurnsResponse>(response);
    } catch (error) {
      return appErr({
        code: 'LLM_SESSION_GET_TURNS_FAILED',
        message: 'Could not load chat session turns.',
        details: error
      });
    }
  });
}
