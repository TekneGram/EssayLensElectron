import { describe, expect, it, vi } from 'vitest';
import type { PythonRequest, PythonResponse } from '../../../shared/llmContracts';
import { LlmOrchestrator } from '../llmOrchestrator';
import { PythonBridgeError } from '../pythonWorkerClient';

function buildOrchestrator(responseFactory: (request: PythonRequest<unknown>) => Promise<PythonResponse<unknown>>) {
  return new LlmOrchestrator({
    workerClient: {
      request: vi.fn(responseFactory)
    },
    requestIdFactory: () => 'req-123',
    now: () => '2026-02-18T00:00:00.000Z',
    timeoutMs: 1000
  });
}

describe('LlmOrchestrator', () => {
  it('returns normalized success when worker returns valid success response', async () => {
    const orchestrator = buildOrchestrator(async (request) => ({
      requestId: request.requestId,
      ok: true,
      data: { reply: 'hello' },
      timestamp: '2026-02-18T00:00:00.000Z'
    }));

    const result = await orchestrator.requestAction('llm.chat', { message: 'hi' });

    expect(result).toEqual({
      requestId: 'req-123',
      ok: true,
      data: { reply: 'hello' },
      timestamp: '2026-02-18T00:00:00.000Z'
    });
  });

  it('maps worker-declared action failures to PY_ACTION_FAILED', async () => {
    const orchestrator = buildOrchestrator(async (request) => ({
      requestId: request.requestId,
      ok: false,
      error: {
        code: 'SOME_WORKER_CODE',
        message: 'worker failed',
        details: { reason: 'x' }
      },
      timestamp: '2026-02-18T00:00:00.000Z'
    }));

    const result = await orchestrator.requestAction('llm.chat', { message: 'hi' });

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'PY_ACTION_FAILED',
        message: 'worker failed'
      }
    });
  });

  it('maps requestId mismatches to PY_INVALID_RESPONSE', async () => {
    const orchestrator = buildOrchestrator(async () => ({
      requestId: 'different-id',
      ok: true,
      data: { reply: 'hello' },
      timestamp: '2026-02-18T00:00:00.000Z'
    }));

    const result = await orchestrator.requestAction('llm.chat', { message: 'hi' });

    expect(result).toMatchObject({
      requestId: 'req-123',
      ok: false,
      error: {
        code: 'PY_INVALID_RESPONSE'
      }
    });
  });

  it('maps bridge failures to required PY_* codes', async () => {
    const timeoutOrchestrator = buildOrchestrator(async () => {
      throw new PythonBridgeError('PY_TIMEOUT', 'timed out');
    });
    await expect(timeoutOrchestrator.requestAction('llm.chat', { message: 'hi' })).resolves.toMatchObject({
      ok: false,
      error: { code: 'PY_TIMEOUT' }
    });

    const downOrchestrator = buildOrchestrator(async () => {
      throw new PythonBridgeError('PY_PROCESS_DOWN', 'down');
    });
    await expect(downOrchestrator.requestAction('llm.chat', { message: 'hi' })).resolves.toMatchObject({
      ok: false,
      error: { code: 'PY_PROCESS_DOWN' }
    });

    const invalidOrchestrator = buildOrchestrator(async () => {
      throw new PythonBridgeError('PY_INVALID_RESPONSE', 'invalid');
    });
    await expect(invalidOrchestrator.requestAction('llm.chat', { message: 'hi' })).resolves.toMatchObject({
      ok: false,
      error: { code: 'PY_INVALID_RESPONSE' }
    });
  });
});
