import fsPromises from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { appErr, appOk } from '../../shared/appResult';
import type {
  ListMessagesResponse,
  LlmNotReadyErrorDetails,
  SendChatMessageRequest,
  SendChatMessageResponse
} from '../../shared/chatContracts';
import { ChatRepository } from '../db/repositories/chatRepository';
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

interface ChatHandlerDeps {
  repository: ChatRepository;
  llmOrchestrator: LlmOrchestrator;
  llmSettingsRepository?: LlmSettingsRepository;
  llmSelectionRepository?: Pick<LlmSelectionRepository, 'getActiveModel' | 'resetSettingsToDefaults'>;
  fileExists?: (targetPath: string) => Promise<boolean>;
  isExecutable?: (targetPath: string) => Promise<boolean>;
  resolveLlmServerPath?: () => string;
}

interface LlmChatPayload extends SendChatMessageRequest {
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
    message
  };
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

  ipcMain.handle(CHAT_CHANNELS.sendMessage, async (_event, request) => {
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
      settings
    };

    const llmResult = await deps.llmOrchestrator.requestAction<
      LlmChatPayload,
      SendChatMessageResponse
    >('llm.chat', llmPayload);
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
