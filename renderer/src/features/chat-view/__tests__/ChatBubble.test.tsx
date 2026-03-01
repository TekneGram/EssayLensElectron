import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatBubble } from '../components/ChatBubble';

describe('ChatBubble', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders markdown content and role label', () => {
    render(
      <ul>
        <ChatBubble
          item={{
            id: 'assistant-1',
            roleClassName: 'assistant',
            text: '**Bold** item:\n\n- One\n- Two'
          }}
          activeSessionSendPhase={undefined}
          showThinking={false}
          isLatestAssistant={true}
        />
      </ul>
    );

    expect(screen.getByText('Assistant')).toBeTruthy();
    expect(screen.getByText('Bold').tagName.toLowerCase()).toBe('strong');
    expect(screen.getByText('One').tagName.toLowerCase()).toBe('li');
    expect(screen.getByText('Two').tagName.toLowerCase()).toBe('li');
  });

  it('shows rotating messages while warming and thinking for latest assistant bubble only', () => {
    const { rerender } = render(
      <ul>
        <ChatBubble
          item={{
            id: 'assistant-2',
            roleClassName: 'assistant',
            text: 'Working...'
          }}
          activeSessionSendPhase="warming"
          showThinking={false}
          isLatestAssistant={true}
        />
      </ul>
    );

    const thinking = screen.getByTestId('chat-bubble-thinking');
    expect(thinking.className).toContain('chat-bubble-thinking--shimmer');
    expect(screen.getByText('-----checking essay------')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('-----eating donuts for a bit------')).toBeTruthy();

    rerender(
      <ul>
        <ChatBubble
          item={{
            id: 'assistant-2',
            roleClassName: 'assistant',
            text: 'Working...'
          }}
          activeSessionSendPhase="thinking"
          showThinking={true}
          isLatestAssistant={true}
        />
      </ul>
    );
    expect(screen.getByText('-----checking essay------')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('-----eating donuts for a bit------')).toBeTruthy();

    rerender(
      <ul>
        <ChatBubble
          item={{
            id: 'assistant-2',
            roleClassName: 'assistant',
            text: 'Working...'
          }}
          activeSessionSendPhase="warming"
          showThinking={true}
          isLatestAssistant={false}
        />
      </ul>
    );

    expect(screen.queryByTestId('chat-bubble-thinking')).toBeNull();
  });
});
