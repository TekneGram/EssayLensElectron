import type { AppResult } from '../../../../../electron/shared/appResult';
import type {
  ChatStreamChunkEvent,
  SendChatMessageRequest,
  SendChatMessageResponse
} from '../../../../../electron/shared/chatContracts';

export type ChatApi = {
  sendMessage: (request: SendChatMessageRequest) => Promise<AppResult<SendChatMessageResponse>>;
  onStreamChunk?: (listener: (event: ChatStreamChunkEvent) => void) => () => void;
};

export function getChatApi(): ChatApi {
  const appWindow = window as Window & { api?: { chat?: ChatApi } };
  if (!appWindow.api?.chat) {
    throw new Error('window.api.chat is not available.');
  }
  return appWindow.api.chat;
}
