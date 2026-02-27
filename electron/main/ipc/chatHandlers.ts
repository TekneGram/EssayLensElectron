import fsPromises from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { appErr, appOk } from '../../shared/appResult';
import type {
  ChatStreamChunkEvent,
  ListMessagesResponse,
  LlmNotReadyErrorDetails,
  SendChatMessageRequest,
  SendChatMessageResponse
} from '../../shared/chatContracts';
import { ChatRepository } from '../db/repositories/chatRepository';
import { LlmChatSessionRepository, type LlmSessionTurn } from '../db/repositories/llmChatSessionRepository';
import { LlmSelectionRepository } from '../db/repositories/llmSelectionRepository';
import { LlmSettingsRepository, type LlmRuntimeSettings } from '../db/repositories/llmSettingsRepository';
import { LlmOrchestrator } from '../services/llmOrchestrator';
import { resolveLlamaServerPath } from '../services/llmRuntimePaths';
import { getLlmNotReadyDetails } from '../services/llmRuntimeReadiness';
import type { IpcMainLike } from './types';

export const CHAT_CHANNELS = {
  listMessages: 'chat/listMessages',
  sendMessage: 'chat/sendMessage'
} as const;

export const CHAT_EVENTS = {
  streamChunk: 'chat/streamChunk'
} as const;

interface ChatHandlerDeps {
  repository: ChatRepository;
  llmOrchestrator: LlmOrchestrator;
  llmSettingsRepository?: LlmSettingsRepository;
  llmChatSessionRepository?: Pick<LlmChatSessionRepository, 'listRecentTurns' | 'appendTurnPair'>;
  llmSelectionRepository?: Pick<LlmSelectionRepository, 'getActiveModel' | 'resetSettingsToDefaults'>;
  fileExists?: (targetPath: string) => Promise<boolean>;
  isExecutable?: (targetPath: string) => Promise<boolean>;
  resolveLlmServerPath?: () => string;
}

interface LlmChatPayload extends SendChatMessageRequest {
  sessionTurns?: LlmSessionTurn[];
  settings: LlmRuntimeSettings;
}

async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await fsPromises.access(targetPath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function isExecutable(targetPath: string): Promise<boolean> {
  if (process.platform === 'win32') {
    return true;
  }
  try {
    await fsPromises.access(targetPath, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveDefaultLlmServerPath(): string {
  const runtimeMode = process.env.VITE_DEV_SERVER_URL || process.env.NODE_ENV === 'development' ? 'dev' : 'packaged';
  return resolveLlamaServerPath({ mode: runtimeMode });
}

function canRecoverMissingServerPath(details: LlmNotReadyErrorDetails): boolean {
  return details.issues.length === 1 && details.issues[0]?.code === 'MISSING_SERVER_PATH';
}

function getDefaultDeps(): ChatHandlerDeps {
  return {
    repository: new ChatRepository(),
    llmOrchestrator: new LlmOrchestrator(),
    llmSettingsRepository: new LlmSettingsRepository(),
    llmChatSessionRepository: new LlmChatSessionRepository(),
    llmSelectionRepository: new LlmSelectionRepository(),
    fileExists,
    isExecutable,
    resolveLlmServerPath: resolveDefaultLlmServerPath
  };
}

function normalizeSendMessageRequest(request: unknown): SendChatMessageRequest | null {
  if (typeof request !== 'object' || request === null) {
    return null;
  }

  const candidate = request as Record<string, unknown>;
  const messageFromValue = typeof candidate.message === 'string' ? candidate.message : null;
  const legacyContentValue = typeof candidate.content === 'string' ? candidate.content : null;
  const message = (messageFromValue ?? legacyContentValue)?.trim();

  if (!message) {
    return null;
  }

  return {
    fileId: typeof candidate.fileId === 'string' ? candidate.fileId : undefined,
    contextText: typeof candidate.contextText === 'string' ? candidate.contextText : undefined,
    message,
    clientRequestId: typeof candidate.clientRequestId === 'string' ? candidate.clientRequestId : undefined,
    sessionId: typeof candidate.sessionId === 'string' ? candidate.sessionId : undefined
  };
}

function resolveSessionId(request: SendChatMessageRequest): string | undefined {
  if (typeof request.sessionId === 'string' && request.sessionId.trim()) {
    return request.sessionId.trim();
  }
  if (typeof request.fileId === 'string' && request.fileId.trim()) {
    return `file:${request.fileId}`;
  }
  return undefined;
}

function makeMessageId(): string {
  return randomUUID();
}

function getReplyText(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }
  const reply = (data as Record<string, unknown>).reply;
  return typeof reply === 'string' && reply.trim().length > 0 ? reply : null;
}

function isEventWithSender(
  event: unknown
): event is { sender: { send: (channel: string, payload: unknown) => void } } {
  if (typeof event !== 'object' || event === null) {
    return false;
  }
  const sender = (event as { sender?: unknown }).sender;
  if (typeof sender !== 'object' || sender === null) {
    return false;
  }
  return typeof (sender as { send?: unknown }).send === 'function';
}

export function registerChatHandlers(ipcMain: IpcMainLike, deps: ChatHandlerDeps = getDefaultDeps()): void {
  ipcMain.handle(CHAT_CHANNELS.listMessages, async (_event, request) => {
    const fileId =
      typeof request === 'object' && request && 'fileId' in request && typeof request.fileId === 'string'
        ? request.fileId
        : undefined;

    try {
      const messages = await deps.repository.listMessages(fileId);
      return appOk<ListMessagesResponse>({ messages });
    } catch (error) {
      return appErr({
        code: 'CHAT_LIST_MESSAGES_FAILED',
        message: 'Could not load chat messages.',
        details: error
      });
    }
  });

  ipcMain.handle(CHAT_CHANNELS.sendMessage, async (event, request) => {
    const normalizedRequest = normalizeSendMessageRequest(request);
    if (!normalizedRequest) {
      return appErr({
        code: 'CHAT_SEND_INVALID_PAYLOAD',
        message: 'Chat message payload must include a non-empty message.'
      });
    }

    const llmSettingsRepository = deps.llmSettingsRepository ?? new LlmSettingsRepository();
    let settings: LlmRuntimeSettings;
    try {
      settings = await llmSettingsRepository.getRuntimeSettings();
    } catch (error) {
      return appErr({
        code: 'LLM_SETTINGS_LOAD_FAILED',
        message: 'Could not load LLM runtime settings.',
        details: error
      });
    }

    const validateFileExists = deps.fileExists ?? fileExists;
    const validateExecutable = deps.isExecutable ?? isExecutable;
    let notReadyDetails = await getLlmNotReadyDetails(settings, {
      fileExists: validateFileExists,
      isExecutable: validateExecutable
    });
    if (notReadyDetails && canRecoverMissingServerPath(notReadyDetails)) {
      const llmSelectionRepository = deps.llmSelectionRepository ?? new LlmSelectionRepository();
      const activeModel = await llmSelectionRepository.getActiveModel();
      if (activeModel) {
        const llmServerPath = (deps.resolveLlmServerPath ?? resolveDefaultLlmServerPath)();
        const reset = await llmSelectionRepository.resetSettingsToDefaults(llmServerPath);
        if (reset?.settings) {
          settings = reset.settings;
          notReadyDetails = await getLlmNotReadyDetails(settings, {
            fileExists: validateFileExists,
            isExecutable: validateExecutable
          });
        }
      }
    }

    if (notReadyDetails) {
      const details: LlmNotReadyErrorDetails = notReadyDetails;
      return appErr({
        code: 'LLM_NOT_READY',
        message: 'LLM runtime is not ready. Select a downloaded model and ensure llama-server is configured.',
        details
      });
    }

    const llmPayload: LlmChatPayload = {
      ...normalizedRequest,
      sessionId: resolveSessionId(normalizedRequest),
      settings
    };
    const resolvedSessionId = llmPayload.sessionId;
    const llmChatSessionRepository = deps.llmChatSessionRepository ?? new LlmChatSessionRepository();
    if (resolvedSessionId) {
      try {
        llmPayload.sessionTurns = await llmChatSessionRepository.listRecentTurns(resolvedSessionId);
      } catch (error) {
        return appErr({
          code: 'CHAT_SESSION_LOAD_FAILED',
          message: 'Could not load chat session context.',
          details: error
        });
      }
    }

    const emitToRenderer = (payload: ChatStreamChunkEvent) => {
      if (!isEventWithSender(event)) {
        return;
      }
      event.sender.send(CHAT_EVENTS.streamChunk, payload);
    };

    const fallbackClientRequestId = makeMessageId();
    const clientRequestId = normalizedRequest.clientRequestId ?? fallbackClientRequestId;
    let llmResult;
    if (typeof deps.llmOrchestrator.requestActionStream === 'function') {
      llmResult = await deps.llmOrchestrator.requestActionStream<
        LlmChatPayload,
        SendChatMessageResponse
      >('llm.chatStream', llmPayload, (streamEvent) => {
        const mappedType =
          streamEvent.type === 'stream_start'
            ? 'start'
            : streamEvent.type === 'stream_chunk'
              ? 'chunk'
              : streamEvent.type === 'stream_done'
                ? 'done'
                : 'error';
        emitToRenderer({
          requestId: streamEvent.requestId,
          clientRequestId: streamEvent.data.clientRequestId ?? clientRequestId,
          fileId: normalizedRequest.fileId,
          type: mappedType,
          seq: streamEvent.data.seq,
          channel: streamEvent.data.channel,
          text: streamEvent.data.text,
          done: streamEvent.data.done,
          error: streamEvent.data.error
        });
      });
    } else {
      llmResult = await deps.llmOrchestrator.requestAction<
        LlmChatPayload,
        SendChatMessageResponse
      >('llm.chat', llmPayload);
    }
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
      if (resolvedSessionId) {
        await llmChatSessionRepository.appendTurnPair(
          resolvedSessionId,
          normalizedRequest.message,
          reply,
          normalizedRequest.fileId
        );
      }
      await deps.repository.addMessage({
        id: makeMessageId(),
        role: 'teacher',
        content: normalizedRequest.message,
        relatedFileId: normalizedRequest.fileId,
        createdAt
      });
      await deps.repository.addMessage({
        id: makeMessageId(),
        role: 'assistant',
        content: reply,
        relatedFileId: normalizedRequest.fileId,
        createdAt
      });
      return appOk<SendChatMessageResponse>({ reply });
    } catch (error) {
      return appErr({
        code: 'CHAT_SEND_PERSIST_FAILED',
        message: 'Chat response was generated but could not be persisted.',
        details: error
      });
    }
  });
}
