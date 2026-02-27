import { describe, expect, it, vi } from 'vitest';
import { LLM_SESSION_CHANNELS, registerLlmSessionHandlers } from '../llmSessionHandlers';

function createHarness() {
  const handle = vi.fn();
  return {
    handle,
    getHandler: (channel: string) => {
      const handler = handle.mock.calls.find(([registeredChannel]) => registeredChannel === channel)?.[1];
      expect(handler).toBeTypeOf('function');
      return handler as (event: unknown, payload?: unknown) => Promise<unknown>;
    }
  };
}

describe('registerLlmSessionHandlers', () => {
  it('creates and clears sessions through orchestrator', async () => {
    const harness = createHarness();
    const requestAction = vi
      .fn()
      .mockResolvedValueOnce({
        requestId: 'create-1',
        ok: true,
        data: { sessionId: 'sess-1' },
        timestamp: '2026-02-27T00:00:00.000Z'
      })
      .mockResolvedValueOnce({
        requestId: 'clear-1',
        ok: true,
        data: { sessionId: 'sess-1', cleared: true },
        timestamp: '2026-02-27T00:00:00.000Z'
      });

    registerLlmSessionHandlers(
      { handle: harness.handle },
      {
        llmOrchestrator: { requestAction } as never
      }
    );

    const createHandler = harness.getHandler(LLM_SESSION_CHANNELS.create);
    const clearHandler = harness.getHandler(LLM_SESSION_CHANNELS.clear);

    await expect(createHandler({}, { sessionId: 'sess-1' })).resolves.toEqual({
      ok: true,
      data: { sessionId: 'sess-1' }
    });
    await expect(clearHandler({}, { sessionId: 'sess-1' })).resolves.toEqual({
      ok: true,
      data: { sessionId: 'sess-1', cleared: true }
    });

    expect(requestAction).toHaveBeenNthCalledWith(1, 'llm.session.create', { sessionId: 'sess-1' });
    expect(requestAction).toHaveBeenNthCalledWith(2, 'llm.session.clear', { sessionId: 'sess-1' });
  });

  it('rejects invalid payload and invalid response', async () => {
    const harness = createHarness();
    const requestAction = vi.fn().mockResolvedValue({
      requestId: 'create-invalid',
      ok: true,
      data: { sessionId: '' },
      timestamp: '2026-02-27T00:00:00.000Z'
    });

    registerLlmSessionHandlers(
      { handle: harness.handle },
      {
        llmOrchestrator: { requestAction } as never
      }
    );

    const createHandler = harness.getHandler(LLM_SESSION_CHANNELS.create);
    const clearHandler = harness.getHandler(LLM_SESSION_CHANNELS.clear);

    await expect(createHandler({}, {})).resolves.toEqual({
      ok: false,
      error: {
        code: 'LLM_SESSION_CREATE_INVALID_PAYLOAD',
        message: 'Create session payload must include a non-empty sessionId string.'
      }
    });
    await expect(clearHandler({}, { sessionId: ' ' })).resolves.toEqual({
      ok: false,
      error: {
        code: 'LLM_SESSION_CLEAR_INVALID_PAYLOAD',
        message: 'Clear session payload must include a non-empty sessionId string.'
      }
    });
    await expect(createHandler({}, { sessionId: 'sess-1' })).resolves.toEqual({
      ok: false,
      error: {
        code: 'LLM_SESSION_CREATE_INVALID_RESPONSE',
        message: 'Python worker returned invalid session create payload.',
        details: { sessionId: '' }
      }
    });
  });
});
