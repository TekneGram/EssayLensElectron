import { describe, expect, it } from 'vitest';
import { initialAppState } from '../../../state';
import {
  addChatMessage,
  selectChatError,
  selectChatStatus,
  setChatError,
  setChatStatus,
  updateChatMessageContent
} from '../state';

describe('chat-interface state helpers', () => {
  it('creates chat actions', () => {
    expect(setChatStatus('sending')).toEqual({ type: 'chat/setStatus', payload: 'sending' });
    expect(setChatError('Failed')).toEqual({ type: 'chat/setError', payload: 'Failed' });
    expect(
      updateChatMessageContent({
        messageId: 'a1',
        content: 'chunk',
        mode: 'append'
      })
    ).toEqual({
      type: 'chat/updateMessageContent',
      payload: { messageId: 'a1', content: 'chunk', mode: 'append' }
    });
    expect(
      addChatMessage({
        id: 'm-1',
        role: 'assistant',
        content: 'Reply',
        createdAt: '2026-02-20T00:00:00.000Z'
      })
    ).toEqual({
      type: 'chat/addMessage',
      payload: {
        id: 'm-1',
        role: 'assistant',
        content: 'Reply',
        createdAt: '2026-02-20T00:00:00.000Z'
      }
    });
  });

  it('selects chat status fields', () => {
    const state = {
      ...initialAppState,
      chat: {
        ...initialAppState.chat,
        status: 'error' as const,
        error: 'Request failed'
      }
    };

    expect(selectChatStatus(state)).toBe('error');
    expect(selectChatError(state)).toBe('Request failed');
  });
});
