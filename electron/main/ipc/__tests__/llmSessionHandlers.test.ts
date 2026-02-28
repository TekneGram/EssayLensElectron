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
    const listSessionsByFile = vi.fn().mockResolvedValue([
      {
        sessionId: 'sess-1',
        fileEntityUuid: 'file-1',
        createdAt: '2026-02-27T00:00:00.000Z',
        updatedAt: '2026-02-27T00:10:00.000Z',
        lastUsedAt: '2026-02-27T00:10:00.000Z'
      }
    ]);
    const clearSession = vi.fn().mockResolvedValue({ sessionId: 'sess-1', cleared: true });
    const deleteSession = vi.fn().mockResolvedValue({ sessionId: 'sess-1', deleted: true });
    const requestAction = vi.fn().mockResolvedValue({
      requestId: 'req-1',
      ok: true,
      data: { sessionId: 'sess-1', cleared: true },
      timestamp: '2026-02-27T00:10:00.000Z'
    });

    registerLlmSessionHandlers(
      { handle: harness.handle },
      {
        llmChatSessionRepository: { createSession, listRecentTurns, listSessionsByFile, clearSession, deleteSession } as never,
        llmOrchestrator: { requestAction } as never
      }
    );

    const createHandler = harness.getHandler(LLM_SESSION_CHANNELS.create);
    const getTurnsHandler = harness.getHandler(LLM_SESSION_CHANNELS.getTurns);
    const listByFileHandler = harness.getHandler(LLM_SESSION_CHANNELS.listByFile);
    const clearHandler = harness.getHandler(LLM_SESSION_CHANNELS.clear);
    const deleteHandler = harness.getHandler(LLM_SESSION_CHANNELS.delete);

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
    await expect(listByFileHandler({}, { fileEntityUuid: 'file-1' })).resolves.toEqual({
      ok: true,
      data: {
        fileEntityUuid: 'file-1',
        sessions: [
          {
            sessionId: 'sess-1',
            fileEntityUuid: 'file-1',
            createdAt: '2026-02-27T00:00:00.000Z',
            updatedAt: '2026-02-27T00:10:00.000Z',
            lastUsedAt: '2026-02-27T00:10:00.000Z'
          }
        ]
      }
    });
    await expect(clearHandler({}, { sessionId: 'sess-1' })).resolves.toEqual({
      ok: true,
      data: { sessionId: 'sess-1', cleared: true }
    });
    await expect(deleteHandler({}, { sessionId: 'sess-1' })).resolves.toEqual({
      ok: true,
      data: { sessionId: 'sess-1', deleted: true }
    });

    expect(createSession).toHaveBeenNthCalledWith(1, 'sess-1', 'file-1');
    expect(listRecentTurns).toHaveBeenNthCalledWith(1, 'sess-1', 'file-1');
    expect(listSessionsByFile).toHaveBeenNthCalledWith(1, 'file-1');
    expect(clearSession).toHaveBeenNthCalledWith(1, 'sess-1');
    expect(deleteSession).toHaveBeenNthCalledWith(1, 'sess-1');
    expect(requestAction).toHaveBeenNthCalledWith(1, 'llm.simpleChat.clearSessionCache', { sessionId: 'sess-1' });
    expect(requestAction).toHaveBeenNthCalledWith(2, 'llm.simpleChat.clearSessionCache', { sessionId: 'sess-1' });
  });

  it('rejects invalid payload and invalid response', async () => {
    const harness = createHarness();
    const createSession = vi.fn().mockResolvedValue({ sessionId: '', fileEntityUuid: '' });
    const listRecentTurns = vi.fn().mockResolvedValue([{ role: 'x', content: 'bad' }]);
    const listSessionsByFile = vi.fn().mockResolvedValue([
      { sessionId: '', fileEntityUuid: '', createdAt: 1, updatedAt: 2, lastUsedAt: 3 }
    ]);
    const clearSession = vi.fn();
    const deleteSession = vi.fn().mockResolvedValue({ sessionId: '', deleted: true });
    const requestAction = vi.fn().mockResolvedValue({
      requestId: 'req-2',
      ok: true,
      data: { sessionId: 'sess-1', cleared: true },
      timestamp: '2026-02-27T00:10:00.000Z'
    });

    registerLlmSessionHandlers(
      { handle: harness.handle },
      {
        llmChatSessionRepository: { createSession, listRecentTurns, listSessionsByFile, clearSession, deleteSession } as never,
        llmOrchestrator: { requestAction } as never
      }
    );

    const createHandler = harness.getHandler(LLM_SESSION_CHANNELS.create);
    const getTurnsHandler = harness.getHandler(LLM_SESSION_CHANNELS.getTurns);
    const listByFileHandler = harness.getHandler(LLM_SESSION_CHANNELS.listByFile);
    const clearHandler = harness.getHandler(LLM_SESSION_CHANNELS.clear);
    const deleteHandler = harness.getHandler(LLM_SESSION_CHANNELS.delete);

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
    await expect(deleteHandler({}, { sessionId: ' ' })).resolves.toEqual({
      ok: false,
      error: {
        code: 'LLM_SESSION_DELETE_INVALID_PAYLOAD',
        message: 'Delete session payload must include a non-empty sessionId string.'
      }
    });
    await expect(getTurnsHandler({}, { sessionId: ' ', fileEntityUuid: 'file-1' })).resolves.toEqual({
      ok: false,
      error: {
        code: 'LLM_SESSION_GET_TURNS_INVALID_PAYLOAD',
        message: 'Get turns payload must include non-empty sessionId and fileEntityUuid strings.'
      }
    });
    await expect(listByFileHandler({}, { fileEntityUuid: ' ' })).resolves.toEqual({
      ok: false,
      error: {
        code: 'LLM_SESSION_LIST_BY_FILE_INVALID_PAYLOAD',
        message: 'List-by-file payload must include a non-empty fileEntityUuid string.'
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
    await expect(listByFileHandler({}, { fileEntityUuid: 'file-1' })).resolves.toEqual({
      ok: false,
      error: {
        code: 'LLM_SESSION_LIST_BY_FILE_INVALID_RESPONSE',
        message: 'Session repository returned invalid list-by-file payload.',
        details: {
          fileEntityUuid: 'file-1',
          sessions: [{ sessionId: '', fileEntityUuid: '', createdAt: 1, updatedAt: 2, lastUsedAt: 3 }]
        }
      }
    });
    await expect(deleteHandler({}, { sessionId: 'sess-1' })).resolves.toEqual({
      ok: false,
      error: {
        code: 'LLM_SESSION_DELETE_INVALID_RESPONSE',
        message: 'Session repository returned invalid delete payload.',
        details: { sessionId: '', deleted: true }
      }
    });
  });
});
