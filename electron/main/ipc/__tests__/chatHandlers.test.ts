import { describe, expect, it, vi } from 'vitest';
import { ChatRepository } from '../../db/repositories/chatRepository';
import { CHAT_CHANNELS, registerChatHandlers } from '../chatHandlers';

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

describe('registerChatHandlers', () => {
  it('sends llm.chat through orchestrator and persists user + assistant messages', async () => {
    const harness = createHarness();
    const repository = new ChatRepository();
    const requestAction = vi.fn().mockResolvedValue({
      requestId: 'req-1',
      ok: true,
      data: { reply: 'Assistant reply' },
      timestamp: '2026-02-18T00:00:00.000Z'
    });

    registerChatHandlers(
      { handle: harness.handle },
      {
        repository,
        llmOrchestrator: { requestAction } as never
      }
    );

    const sendMessageHandler = harness.getHandler(CHAT_CHANNELS.sendMessage);
    const listMessagesHandler = harness.getHandler(CHAT_CHANNELS.listMessages);

    const sendResult = await sendMessageHandler({}, { fileId: 'file-1', message: 'Teacher prompt' });
    expect(sendResult).toEqual({ ok: true, data: { reply: 'Assistant reply' } });

    expect(requestAction).toHaveBeenCalledWith(
      'llm.chat',
      expect.objectContaining({
        fileId: 'file-1',
        contextText: undefined,
        message: 'Teacher prompt',
        settings: expect.objectContaining({
          llm_server_url: 'http://127.0.0.1:8080/v1/chat/completions'
        })
      })
    );

    const listResult = await listMessagesHandler({}, { fileId: 'file-1' });
    expect(listResult).toMatchObject({
      ok: true,
      data: {
        messages: [
          {
            role: 'teacher',
            content: 'Teacher prompt',
            relatedFileId: 'file-1'
          },
          {
            role: 'assistant',
            content: 'Assistant reply',
            relatedFileId: 'file-1'
          }
        ]
      }
    });
  });

  it('returns mapped orchestrator failures and does not persist messages', async () => {
    const harness = createHarness();
    const repository = new ChatRepository();
    const requestAction = vi.fn().mockResolvedValue({
      requestId: 'req-timeout',
      ok: false,
      error: {
        code: 'PY_TIMEOUT',
        message: 'Python worker timed out.'
      },
      timestamp: '2026-02-18T00:00:00.000Z'
    });

    registerChatHandlers(
      { handle: harness.handle },
      {
        repository,
        llmOrchestrator: { requestAction } as never
      }
    );

    const sendMessageHandler = harness.getHandler(CHAT_CHANNELS.sendMessage);
    const listMessagesHandler = harness.getHandler(CHAT_CHANNELS.listMessages);

    const sendResult = await sendMessageHandler({}, { message: 'Teacher prompt' });
    expect(sendResult).toEqual({
      ok: false,
      error: {
        code: 'PY_TIMEOUT',
        message: 'Python worker timed out.'
      }
    });

    const listResult = await listMessagesHandler({}, undefined);
    expect(listResult).toEqual({ ok: true, data: { messages: [] } });
  });

  it('rejects invalid payloads before orchestrator call', async () => {
    const harness = createHarness();
    const requestAction = vi.fn();

    registerChatHandlers(
      { handle: harness.handle },
      {
        repository: new ChatRepository(),
        llmOrchestrator: { requestAction } as never
      }
    );

    const sendMessageHandler = harness.getHandler(CHAT_CHANNELS.sendMessage);
    const sendResult = await sendMessageHandler({}, { message: '   ' });

    expect(sendResult).toEqual({
      ok: false,
      error: {
        code: 'CHAT_SEND_INVALID_PAYLOAD',
        message: 'Chat message payload must include a non-empty message.'
      }
    });
    expect(requestAction).not.toHaveBeenCalled();
  });
});
