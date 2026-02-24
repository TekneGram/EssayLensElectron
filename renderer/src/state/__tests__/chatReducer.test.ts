import { describe, expect, it } from 'vitest';
import { initialChatState } from '../initialState';
import { chatReducer } from '../reducers';

describe('chatReducer', () => {
  it('appends a message', () => {
    const next = chatReducer(initialChatState, {
      type: 'chat/addMessage',
      payload: {
        id: 'm1',
        role: 'assistant',
        content: 'Hello',
        createdAt: '2026-02-18T00:00:00.000Z'
      }
    });

    expect(next.messages).toHaveLength(1);
    expect(initialChatState.messages).toHaveLength(0);
  });

  it('sets status and error', () => {
    const sending = chatReducer(initialChatState, {
      type: 'chat/setStatus',
      payload: 'sending'
    });

    const withError = chatReducer(sending, {
      type: 'chat/setError',
      payload: 'Request failed'
    });

    expect(sending.status).toBe('sending');
    expect(withError.error).toBe('Request failed');
  });

  it('updates message content incrementally', () => {
    const seeded = chatReducer(initialChatState, {
      type: 'chat/addMessage',
      payload: {
        id: 'm1',
        role: 'assistant',
        content: '',
        createdAt: '2026-02-18T00:00:00.000Z'
      }
    });
    const appended = chatReducer(seeded, {
      type: 'chat/updateMessageContent',
      payload: {
        messageId: 'm1',
        content: 'Hel',
        mode: 'append'
      }
    });
    const replaced = chatReducer(appended, {
      type: 'chat/updateMessageContent',
      payload: {
        messageId: 'm1',
        content: 'Hello',
        mode: 'replace'
      }
    });

    expect(appended.messages[0]?.content).toBe('Hel');
    expect(replaced.messages[0]?.content).toBe('Hello');
  });
});
