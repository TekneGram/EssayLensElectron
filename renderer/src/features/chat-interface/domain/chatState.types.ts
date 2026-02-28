import type { ChatDataArray } from './chatMessage.types';
import type { LlmSessionListItemDto } from '../../../../../electron/shared/llm-session';

export type SessionListStatus = 'idle' | 'loading' | 'error';
export type SessionSendPhase = 'warming' | 'thinking';

export interface ChatState {
  messages: ChatDataArray;
  status: 'idle' | 'sending' | 'error';
  error?: string;
  activeSessionIdByFileId: Record<string, string | undefined>;
  sessionsByFileId: Record<string, LlmSessionListItemDto[] | undefined>;
  sessionsStatusByFileId: Record<string, SessionListStatus | undefined>;
  sessionsErrorByFileId: Record<string, string | undefined>;
  sessionSyncNonceByFileId: Record<string, number | undefined>;
  sessionSendPhaseBySessionId: Record<string, SessionSendPhase | undefined>;
}
