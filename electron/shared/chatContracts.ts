export interface ChatMessageDto {
  id: string;
  role: 'system' | 'teacher' | 'assistant';
  content: string;
  relatedFileId?: string;
  createdAt: string;
}

export interface ListMessagesRequest {
  fileId?: string;
}

export interface ListMessagesResponse {
  messages: ChatMessageDto[];
}

export interface SendChatMessageRequest {
  fileId?: string;
  message: string;
  contextText?: string;
}

export interface SendChatMessageResponse {
  reply: string;
}
