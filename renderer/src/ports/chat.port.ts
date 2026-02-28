import type { AppResult } from '../../../electron/shared/appResult';
import type {
  ChatStreamChunkEvent,
  ListMessagesResponse,
  SendChatMessageRequest,
  SendChatMessageResponse
} from '../../../electron/shared/chatContracts';

export interface ChatPort {
  listMessages(fileId?: string): Promise<AppResult<ListMessagesResponse>>;
  sendMessage(request: SendChatMessageRequest): Promise<AppResult<SendChatMessageResponse>>;
  onStreamChunk(listener: (event: ChatStreamChunkEvent) => void): () => void;
}
