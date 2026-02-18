export interface ChatMessageDto {
  id: string;
  role: 'system' | 'teacher' | 'assistant';
  content: string;
  relatedFileId?: string;
  createdAt: string;
}

export interface ListMessagesResultData {
  messages: ChatMessageDto[];
}

export interface SendChatMessagePayload {
  fileId?: string;
  message: string;
  contextText?: string;
}

export interface SendChatMessageResultData {
  reply: string;
}

