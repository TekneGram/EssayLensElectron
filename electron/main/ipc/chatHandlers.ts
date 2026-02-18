import { appErr, appOk } from '../../shared/appResult';
import type { ListMessagesResultData, SendChatMessagePayload, SendChatMessageResultData } from '../../shared/chatContracts';
import { ChatRepository } from '../db/repositories/chatRepository';
import { LlmOrchestrator } from '../services/llmOrchestrator';
import type { IpcMainLike } from './types';

export const CHAT_CHANNELS = {
  listMessages: 'chat/listMessages',
  sendMessage: 'chat/sendMessage'
} as const;

interface ChatHandlerDeps {
  repository: ChatRepository;
  llmOrchestrator: LlmOrchestrator;
}

function getDefaultDeps(): ChatHandlerDeps {
  return {
    repository: new ChatRepository(),
    llmOrchestrator: new LlmOrchestrator()
  };
}

function normalizeSendPayload(payload: unknown): SendChatMessagePayload | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  const messageFromValue = typeof candidate.message === 'string' ? candidate.message : null;
  const legacyContentValue = typeof candidate.content === 'string' ? candidate.content : null;
  const message = (messageFromValue ?? legacyContentValue)?.trim();

  if (!message) {
    return null;
  }

  return {
    fileId: typeof candidate.fileId === 'string' ? candidate.fileId : undefined,
    contextText: typeof candidate.contextText === 'string' ? candidate.contextText : undefined,
    message
  };
}

function makeMessageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getReplyText(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }
  const reply = (data as Record<string, unknown>).reply;
  return typeof reply === 'string' && reply.trim().length > 0 ? reply : null;
}

export function registerChatHandlers(ipcMain: IpcMainLike, deps: ChatHandlerDeps = getDefaultDeps()): void {
  ipcMain.handle(CHAT_CHANNELS.listMessages, async (_event, payload) => {
    const fileId =
      typeof payload === 'object' && payload && 'fileId' in payload && typeof payload.fileId === 'string'
        ? payload.fileId
        : undefined;

    try {
      const messages = await deps.repository.listMessages(fileId);
      return appOk<ListMessagesResultData>({ messages });
    } catch (error) {
      return appErr({
        code: 'CHAT_LIST_MESSAGES_FAILED',
        message: 'Could not load chat messages.',
        details: error
      });
    }
  });

  ipcMain.handle(CHAT_CHANNELS.sendMessage, async (_event, payload) => {
    const normalizedPayload = normalizeSendPayload(payload);
    if (!normalizedPayload) {
      return appErr({
        code: 'CHAT_SEND_INVALID_PAYLOAD',
        message: 'Chat message payload must include a non-empty message.'
      });
    }

    const llmResult = await deps.llmOrchestrator.requestAction<
      SendChatMessagePayload,
      SendChatMessageResultData
    >('llm.chat', normalizedPayload);
    if (!llmResult.ok) {
      return appErr(llmResult.error);
    }

    const reply = getReplyText(llmResult.data);
    if (!reply) {
      return appErr({
        code: 'PY_INVALID_RESPONSE',
        message: 'Python worker returned chat success without a valid reply.',
        details: llmResult.data
      });
    }

    const createdAt = new Date().toISOString();
    try {
      await deps.repository.addMessage({
        id: makeMessageId('teacher'),
        role: 'teacher',
        content: normalizedPayload.message,
        relatedFileId: normalizedPayload.fileId,
        createdAt
      });
      await deps.repository.addMessage({
        id: makeMessageId('assistant'),
        role: 'assistant',
        content: reply,
        relatedFileId: normalizedPayload.fileId,
        createdAt
      });
      return appOk<SendChatMessageResultData>({ reply });
    } catch (error) {
      return appErr({
        code: 'CHAT_SEND_PERSIST_FAILED',
        message: 'Chat response was generated but could not be persisted.',
        details: error
      });
    }
  });
}

