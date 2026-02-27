import type { LlmSessionListItemDto } from '../../../../../electron/shared/llm-session';

export function toListByFileErrorMessage(code: string | undefined, fallbackMessage: string | undefined): string {
  if (code === 'LLM_SESSION_LIST_BY_FILE_INVALID_PAYLOAD') {
    return 'Could not load sessions due to invalid file selection payload.';
  }
  if (code === 'LLM_SESSION_LIST_BY_FILE_FAILED') {
    return 'Could not load chat sessions for this file.';
  }
  if (code === 'LLM_SESSION_LIST_BY_FILE_INVALID_RESPONSE') {
    return 'Session service returned an invalid response.';
  }
  return fallbackMessage || 'Could not load chat sessions.';
}

export function resolvePreferredSession(
  sessions: LlmSessionListItemDto[],
  preferredSessionId?: string
): LlmSessionListItemDto | null {
  if (sessions.length === 0) {
    return null;
  }

  return sessions.find((session) => session.sessionId === preferredSessionId) ?? sessions[0];
}
