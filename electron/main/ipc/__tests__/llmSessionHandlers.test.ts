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
  it('creates, gets turns, and clears sessions through repository', async () => {
    const harness = createHarness();
    const createSession = vi.fn().mockResolvedValue({ sessionId: 'sess-1', fileEntityUuid: 'file-1' });
    const listRecentTurns = vi.fn().mockResolvedValue([
      { role: 'teacher', content: 'hello' },
      { role: 'assistant', content: 'hi there' }
    ]);
    const clearSession = vi.fn().mockResolvedValue({ sessionId: 'sess-1', cleared: true });

    registerLlmSessionHandlers(
      { handle: harness.handle },
      {
        llmChatSessionRepository: { createSession, listRecentTurns, clearSession } as never
      }
    );

    const createHandler = harness.getHandler(LLM_SESSION_CHANNELS.create);
    const getTurnsHandler = harness.getHandler(LLM_SESSION_CHANNELS.getTurns);
    const clearHandler = harness.getHandler(LLM_SESSION_CHANNELS.clear);

    await expect(createHandler({}, { sessionId: 'sess-1', fileEntityUuid: 'file-1' })).resolves.toEqual({
      ok: true,
      data: { sessionId: 'sess-1', fileEntityUuid: 'file-1' }
    });
    await expect(getTurnsHandler({}, { sessionId: 'sess-1', fileEntityUuid: 'file-1' })).resolves.toEqual({
      ok: true,
      data: {
        sessionId: 'sess-1',
        fileEntityUuid: 'file-1',
        turns: [
          { role: 'teacher', content: 'hello' },
          { role: 'assistant', content: 'hi there' }
        ]
      }
    });
    await expect(clearHandler({}, { sessionId: 'sess-1' })).resolves.toEqual({
      ok: true,
      data: { sessionId: 'sess-1', cleared: true }
    });

    expect(createSession).toHaveBeenNthCalledWith(1, 'sess-1', 'file-1');
    expect(listRecentTurns).toHaveBeenNthCalledWith(1, 'sess-1', 'file-1');
    expect(clearSession).toHaveBeenNthCalledWith(1, 'sess-1');
  });

  it('rejects invalid payload and invalid response', async () => {
    const harness = createHarness();
    const createSession = vi.fn().mockResolvedValue({ sessionId: '', fileEntityUuid: '' });
    const listRecentTurns = vi.fn().mockResolvedValue([{ role: 'x', content: 'bad' }]);
    const clearSession = vi.fn();

    registerLlmSessionHandlers(
      { handle: harness.handle },
      {
        llmChatSessionRepository: { createSession, listRecentTurns, clearSession } as never
      }
    );

    const createHandler = harness.getHandler(LLM_SESSION_CHANNELS.create);
    const getTurnsHandler = harness.getHandler(LLM_SESSION_CHANNELS.getTurns);
    const clearHandler = harness.getHandler(LLM_SESSION_CHANNELS.clear);

    await expect(createHandler({}, {})).resolves.toEqual({
      ok: false,
      error: {
        code: 'LLM_SESSION_CREATE_INVALID_PAYLOAD',
        message: 'Create session payload must include non-empty sessionId and fileEntityUuid strings.'
      }
    });
    await expect(clearHandler({}, { sessionId: ' ' })).resolves.toEqual({
      ok: false,
      error: {
        code: 'LLM_SESSION_CLEAR_INVALID_PAYLOAD',
        message: 'Clear session payload must include a non-empty sessionId string.'
      }
    });
    await expect(getTurnsHandler({}, { sessionId: ' ', fileEntityUuid: 'file-1' })).resolves.toEqual({
      ok: false,
      error: {
        code: 'LLM_SESSION_GET_TURNS_INVALID_PAYLOAD',
        message: 'Get turns payload must include non-empty sessionId and fileEntityUuid strings.'
      }
    });
    await expect(createHandler({}, { sessionId: 'sess-1', fileEntityUuid: 'file-1' })).resolves.toEqual({
      ok: false,
      error: {
        code: 'LLM_SESSION_CREATE_INVALID_RESPONSE',
        message: 'Session repository returned invalid create payload.',
        details: { sessionId: '', fileEntityUuid: '' }
      }
    });
    await expect(getTurnsHandler({}, { sessionId: 'sess-1', fileEntityUuid: 'file-1' })).resolves.toEqual({
      ok: false,
      error: {
        code: 'LLM_SESSION_GET_TURNS_INVALID_RESPONSE',
        message: 'Session repository returned invalid turns payload.',
        details: {
          sessionId: 'sess-1',
          fileEntityUuid: 'file-1',
          turns: [{ role: 'x', content: 'bad' }]
        }
      }
    });
  });
});
