import type { LlmAction, PythonRequest, PythonResponse } from '../../shared/llmContracts';
import { PythonBridgeError, PythonWorkerClient, type PythonBridgeErrorCode } from './pythonWorkerClient';

const SUPPORTED_ACTIONS = new Set<LlmAction>([
  'llm.assessEssay',
  'llm.chat',
  'llm.generateFeedbackSummary'
]);

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

export type LlmResponse<TData = unknown> = Exclude<PythonResponse<TData>, { ok: false }> | LlmFailure;

interface PythonWorkerClientLike {
  request(request: PythonRequest<unknown>, options?: { timeoutMs?: number }): Promise<PythonResponse<unknown>>;
  shutdown?(): void;
}

interface LlmOrchestratorDeps {
  workerClient: PythonWorkerClientLike;
  requestIdFactory: () => string;
  now: () => string;
  timeoutMs: number;
}

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getDefaultDeps(): LlmOrchestratorDeps {
  return {
    workerClient: new PythonWorkerClient(),
    requestIdFactory: createRequestId,
    now: () => new Date().toISOString(),
    timeoutMs: 60_000
  };
}

function createFailure(
  requestId: string,
  code: LlmFailure['error']['code'],
  message: string,
  details?: unknown
): LlmFailure {
  return {
    requestId,
    ok: false,
    error: {
      code,
      message,
      details
    },
    timestamp: new Date().toISOString()
  };
}

function mapBridgeErrorCode(code: PythonBridgeErrorCode): LlmFailure['error']['code'] {
  switch (code) {
    case 'PY_TIMEOUT':
      return 'PY_TIMEOUT';
    case 'PY_PROCESS_DOWN':
      return 'PY_PROCESS_DOWN';
    case 'PY_INVALID_RESPONSE':
      return 'PY_INVALID_RESPONSE';
    default:
      return 'PY_PROCESS_DOWN';
  }
}

export class LlmOrchestrator {
  private readonly deps: LlmOrchestratorDeps;

  constructor(deps: Partial<LlmOrchestratorDeps> = {}) {
    this.deps = {
      ...getDefaultDeps(),
      ...deps
    };
  }

  async requestAction<TPayload, TResponse>(action: LlmAction, payload: TPayload): Promise<LlmResponse<TResponse>> {
    const request: PythonRequest<TPayload> = {
      requestId: this.deps.requestIdFactory(),
      action,
      payload,
      timestamp: this.deps.now()
    };
    return this.request<TPayload, TResponse>(request);
  }

  async request<TPayload, TResponse>(request: PythonRequest<TPayload>): Promise<LlmResponse<TResponse>> {
    if (!SUPPORTED_ACTIONS.has(request.action)) {
      return createFailure(
        request.requestId,
        'PY_ACTION_FAILED',
        `Unsupported Python action: ${request.action}.`
      );
    }

    try {
      const response = await this.deps.workerClient.request(request as PythonRequest<unknown>, {
        timeoutMs: this.deps.timeoutMs
      });

      if (response.requestId !== request.requestId) {
        return createFailure(
          request.requestId,
          'PY_INVALID_RESPONSE',
          'Python worker response requestId did not match the request.',
          { expected: request.requestId, received: response.requestId }
        );
      }

      if (response.ok) {
        return response as LlmResponse<TResponse>;
      }

      return createFailure(
        request.requestId,
        'PY_ACTION_FAILED',
        response.error.message || 'Python worker reported action failure.',
        response.error
      );
    } catch (error) {
      if (error instanceof PythonBridgeError) {
        return createFailure(request.requestId, mapBridgeErrorCode(error.code), error.message, error.details);
      }
      return createFailure(
        request.requestId,
        'PY_PROCESS_DOWN',
        'Python worker request failed unexpectedly.',
        error
      );
    }
  }

  shutdown(): void {
    this.deps.workerClient.shutdown?.();
  }
}

