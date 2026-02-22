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

export type LlmReadinessIssueCode =
  | 'MISSING_GGUF_PATH'
  | 'GGUF_FILE_NOT_FOUND'
  | 'MISSING_SERVER_PATH'
  | 'SERVER_FILE_NOT_FOUND'
  | 'SERVER_NOT_EXECUTABLE';

export interface LlmReadinessIssue {
  code: LlmReadinessIssueCode;
  message: string;
  path?: string;
}

export interface LlmNotReadyErrorDetails {
  issues: LlmReadinessIssue[];
  fakeMode: boolean;
}
