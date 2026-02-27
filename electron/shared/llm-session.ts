export interface CreateLlmSessionRequest {
  sessionId: string;
  fileEntityUuid: string;
}

export interface CreateLlmSessionResponse {
  sessionId: string;
  fileEntityUuid: string;
}

export interface ClearLlmSessionRequest {
  sessionId: string;
}

export interface ClearLlmSessionResponse {
  sessionId: string;
  cleared: boolean;
}

export interface GetLlmSessionTurnsRequest {
  sessionId: string;
  fileEntityUuid: string;
}

export interface LlmSessionTurnDto {
  role: 'teacher' | 'assistant' | 'system';
  content: string;
}

export interface GetLlmSessionTurnsResponse {
  sessionId: string;
  fileEntityUuid: string;
  turns: LlmSessionTurnDto[];
}
