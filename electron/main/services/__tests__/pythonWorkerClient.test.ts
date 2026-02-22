import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PythonRequest } from '../../../shared/llmContracts';
import { PythonWorkerClient } from '../pythonWorkerClient';

class FakeChildProcess extends EventEmitter {
  readonly stdout = new PassThrough();
  readonly stderr = new PassThrough();
  readonly stdin = {
    write: vi.fn((_: string, callback?: (error?: Error | null) => void) => {
      callback?.(null);
      return true;
    })
  };
  killed = false;
  exitCode: number | null = null;

  kill(): boolean {
    this.killed = true;
    this.exitCode = 0;
    this.emit('exit', 0, null);
    return true;
  }
}

function makeRequest(requestId: string): PythonRequest<{ message: string }> {
  return {
    requestId,
    action: 'llm.chat',
    payload: { message: `msg-${requestId}` },
    timestamp: new Date().toISOString()
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('PythonWorkerClient', () => {
  it('correlates responses by requestId when responses arrive out of order', async () => {
    const worker = new FakeChildProcess();
    const client = new PythonWorkerClient({
      spawn: vi.fn().mockReturnValue(worker as never),
      workerCommand: 'python3',
      workerArgs: ['-u', '/tmp/fake-worker.py'],
      defaultTimeoutMs: 1000
    });

    const req1 = makeRequest('req-1');
    const req2 = makeRequest('req-2');

    const promise1 = client.request(req1);
    const promise2 = client.request(req2);

    worker.stdout.write(
      `${JSON.stringify({ requestId: 'req-unknown', ok: true, data: { reply: 'ignored' }, timestamp: 't' })}\n`
    );
    worker.stdout.write(
      `${JSON.stringify({ requestId: 'req-2', ok: true, data: { reply: 'second' }, timestamp: 't' })}\n`
    );
    worker.stdout.write(
      `${JSON.stringify({ requestId: 'req-1', ok: true, data: { reply: 'first' }, timestamp: 't' })}\n`
    );

    await expect(promise1).resolves.toMatchObject({ requestId: 'req-1', ok: true, data: { reply: 'first' } });
    await expect(promise2).resolves.toMatchObject({ requestId: 'req-2', ok: true, data: { reply: 'second' } });
  });

  it('maps malformed worker output to PY_INVALID_RESPONSE', async () => {
    const worker = new FakeChildProcess();
    const client = new PythonWorkerClient({
      spawn: vi.fn().mockReturnValue(worker as never),
      workerCommand: 'python3',
      workerArgs: ['-u', '/tmp/fake-worker.py'],
      defaultTimeoutMs: 1000
    });

    const requestPromise = client.request(makeRequest('req-invalid'));
    worker.stdout.write('not-json\n');

    await expect(requestPromise).rejects.toMatchObject({
      code: 'PY_INVALID_RESPONSE'
    });
  });

  it('maps process exit before response to PY_PROCESS_DOWN', async () => {
    const worker = new FakeChildProcess();
    const client = new PythonWorkerClient({
      spawn: vi.fn().mockReturnValue(worker as never),
      workerCommand: 'python3',
      workerArgs: ['-u', '/tmp/fake-worker.py'],
      defaultTimeoutMs: 1000
    });

    const requestPromise = client.request(makeRequest('req-down'));
    worker.emit('exit', 1, null);

    await expect(requestPromise).rejects.toMatchObject({
      code: 'PY_PROCESS_DOWN'
    });
  });

  it('maps unanswered requests to PY_TIMEOUT', async () => {
    vi.useFakeTimers();
    const worker = new FakeChildProcess();
    const client = new PythonWorkerClient({
      spawn: vi.fn().mockReturnValue(worker as never),
      workerCommand: 'python3',
      workerArgs: ['-u', '/tmp/fake-worker.py'],
      defaultTimeoutMs: 1000
    });

    const requestPromise = client.request(makeRequest('req-timeout'), { timeoutMs: 25 });
    const capturedRejection = requestPromise.catch((error) => error);
    await vi.advanceTimersByTimeAsync(30);

    await expect(capturedRejection).resolves.toMatchObject({
      code: 'PY_TIMEOUT'
    });
  });
});
