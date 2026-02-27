export interface CreateLlmSessionRequest {
  sessionId: string;
}

export interface CreateLlmSessionResponse {
  sessionId: string;
}

export interface ClearLlmSessionRequest {
  sessionId: string;
}

export interface ClearLlmSessionResponse {
  sessionId: string;
  cleared: boolean;
}
