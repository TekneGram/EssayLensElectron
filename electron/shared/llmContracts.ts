export type LlmAction = 'llm.assessEssay' | 'llm.chat' | 'llm.generateFeedbackSummary';

export interface PythonRequest<TPayload = unknown> {
  requestId: string;
  action: LlmAction;
  payload: TPayload;
  timestamp: string;
}

export interface PythonSuccess<TData = unknown> {
  requestId: string;
  ok: true;
  data: TData;
  timestamp: string;
}

export interface PythonFailure {
  requestId: string;
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export type PythonResponse<TData = unknown> = PythonSuccess<TData> | PythonFailure;

