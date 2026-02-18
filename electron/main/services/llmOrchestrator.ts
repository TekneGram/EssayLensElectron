export type LlmAction = 'llm.assessEssay' | 'llm.chat' | 'llm.generateFeedbackSummary';

export interface LlmRequest<TPayload = unknown> {
  requestId: string;
  action: LlmAction;
  payload: TPayload;
  timestamp: string;
}

export interface LlmSuccess<TData = unknown> {
  requestId: string;
  ok: true;
  data: TData;
  timestamp: string;
}

export interface LlmFailure {
  requestId: string;
  ok: false;
  error: {
    code: 'PY_TIMEOUT' | 'PY_PROCESS_DOWN' | 'PY_INVALID_RESPONSE' | 'PY_ACTION_FAILED';
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export type LlmResponse<TData = unknown> = LlmSuccess<TData> | LlmFailure;

export class LlmOrchestrator {
  async request<TPayload, TResponse>(request: LlmRequest<TPayload>): Promise<LlmResponse<TResponse>> {
    return {
      requestId: request.requestId,
      ok: false,
      error: {
        code: 'PY_PROCESS_DOWN',
        message: 'Python worker integration is not implemented in phase 2.'
      },
      timestamp: new Date().toISOString()
    };
  }
}
