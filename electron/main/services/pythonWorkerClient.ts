import { spawn, type ChildProcessWithoutNullStreams, type SpawnOptionsWithoutStdio } from 'node:child_process';
import path from 'node:path';
import type { PythonRequest, PythonResponse } from '../../shared/llmContracts';

export type PythonBridgeErrorCode = 'PY_TIMEOUT' | 'PY_PROCESS_DOWN' | 'PY_INVALID_RESPONSE';

export class PythonBridgeError extends Error {
  readonly code: PythonBridgeErrorCode;
  readonly details?: unknown;

  constructor(code: PythonBridgeErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'PythonBridgeError';
    this.code = code;
    this.details = details;
  }
}

type SpawnLike = (
  command: string,
  args: string[],
  options: SpawnOptionsWithoutStdio
) => ChildProcessWithoutNullStreams;

interface PendingRequest {
  requestId: string;
  resolve: (value: PythonResponse<unknown>) => void;
  reject: (error: PythonBridgeError) => void;
  timeoutId: NodeJS.Timeout;
}

export interface PythonWorkerClientDeps {
  spawn: SpawnLike;
  pythonCommand: string;
  workerScriptPath: string;
  defaultTimeoutMs: number;
}

function getDefaultDeps(): PythonWorkerClientDeps {
  return {
    spawn,
    pythonCommand: process.env.PYTHON_EXECUTABLE ?? 'python3',
    workerScriptPath: process.env.PYTHON_WORKER_PATH ?? path.resolve(process.cwd(), 'electron-llm', 'main.py'),
    defaultTimeoutMs: 60_000
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidPythonResponse(value: unknown): value is PythonResponse<unknown> {
  if (!isPlainObject(value) || typeof value.requestId !== 'string' || typeof value.ok !== 'boolean') {
    return false;
  }

  if (value.ok) {
    return 'data' in value;
  }

  if (!('error' in value) || !isPlainObject(value.error)) {
    return false;
  }

  return typeof value.error.message === 'string';
}

export class PythonWorkerClient {
  private readonly deps: PythonWorkerClientDeps;
  private worker: ChildProcessWithoutNullStreams | null = null;
  private readonly pendingRequests = new Map<string, PendingRequest>();
  private stdoutBuffer = '';

  constructor(deps: Partial<PythonWorkerClientDeps> = {}) {
    this.deps = {
      ...getDefaultDeps(),
      ...deps
    };
  }

  async request(
    request: PythonRequest<unknown>,
    options?: { timeoutMs?: number }
  ): Promise<PythonResponse<unknown>> {
    const worker = this.ensureWorker();
    const timeoutMs = options?.timeoutMs ?? this.deps.defaultTimeoutMs;

    return new Promise<PythonResponse<unknown>>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.rejectPending(
          request.requestId,
          new PythonBridgeError(
            'PY_TIMEOUT',
            `Python worker timed out after ${timeoutMs}ms for action ${request.action}.`
          )
        );
      }, timeoutMs);

      this.pendingRequests.set(request.requestId, {
        requestId: request.requestId,
        resolve,
        reject,
        timeoutId
      });

      worker.stdin.write(`${JSON.stringify(request)}\n`, (error) => {
        if (!error) {
          return;
        }
        this.rejectPending(
          request.requestId,
          new PythonBridgeError(
            'PY_PROCESS_DOWN',
            'Failed to write request to Python worker stdin.',
            error
          )
        );
      });
    });
  }

  shutdown(): void {
    if (this.worker && !this.worker.killed) {
      this.worker.kill();
    }
    this.worker = null;
    this.stdoutBuffer = '';
    this.rejectAllPending(
      new PythonBridgeError(
        'PY_PROCESS_DOWN',
        'Python worker was shut down before completing all pending requests.'
      )
    );
  }

  private ensureWorker(): ChildProcessWithoutNullStreams {
    if (this.worker && this.worker.exitCode === null && !this.worker.killed) {
      return this.worker;
    }

    try {
      const worker = this.deps.spawn(
        this.deps.pythonCommand,
        ['-u', this.deps.workerScriptPath],
        {
          stdio: 'pipe'
        }
      );
      this.worker = worker;
      this.stdoutBuffer = '';

      worker.stdout.setEncoding('utf8');
      worker.stdout.on('data', (chunk: string) => {
        this.handleStdoutChunk(chunk);
      });
      worker.on('error', (error) => {
        this.rejectAllPending(
          new PythonBridgeError('PY_PROCESS_DOWN', 'Python worker failed to start or crashed.', error)
        );
      });
      worker.on('exit', (code, signal) => {
        this.worker = null;
        this.rejectAllPending(
          new PythonBridgeError(
            'PY_PROCESS_DOWN',
            `Python worker exited before responding (code=${String(code)}, signal=${String(signal)}).`
          )
        );
      });

      return worker;
    } catch (error) {
      throw new PythonBridgeError('PY_PROCESS_DOWN', 'Failed to spawn Python worker process.', error);
    }
  }

  private handleStdoutChunk(chunk: string): void {
    this.stdoutBuffer += chunk;

    while (true) {
      const newlineIndex = this.stdoutBuffer.indexOf('\n');
      if (newlineIndex === -1) {
        break;
      }

      const rawLine = this.stdoutBuffer.slice(0, newlineIndex).trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(newlineIndex + 1);

      if (!rawLine) {
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawLine);
      } catch (error) {
        this.rejectAllPending(
          new PythonBridgeError('PY_INVALID_RESPONSE', 'Python worker returned malformed JSON.', {
            line: rawLine,
            cause: error
          })
        );
        continue;
      }

      if (!isValidPythonResponse(parsed)) {
        this.rejectAllPending(
          new PythonBridgeError('PY_INVALID_RESPONSE', 'Python worker returned an invalid response envelope.', {
            response: parsed
          })
        );
        continue;
      }

      const pending = this.pendingRequests.get(parsed.requestId);
      if (!pending) {
        continue;
      }

      clearTimeout(pending.timeoutId);
      this.pendingRequests.delete(parsed.requestId);
      pending.resolve(parsed);
    }
  }

  private rejectPending(requestId: string, error: PythonBridgeError): void {
    const pending = this.pendingRequests.get(requestId);
    if (!pending) {
      return;
    }
    clearTimeout(pending.timeoutId);
    this.pendingRequests.delete(requestId);
    pending.reject(error);
  }

  private rejectAllPending(error: PythonBridgeError): void {
    const entries = [...this.pendingRequests.values()];
    this.pendingRequests.clear();
    for (const pending of entries) {
      clearTimeout(pending.timeoutId);
      pending.reject(error);
    }
  }
}
