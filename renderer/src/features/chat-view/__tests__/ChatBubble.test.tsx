import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChatBubble } from '../components/ChatBubble';

describe('ChatBubble', () => {
  it('renders markdown content and role label', () => {
    render(
      <ul>
        <ChatBubble
          item={{
            id: 'assistant-1',
            roleClassName: 'assistant',
            text: '**Bold** item:\n\n- One\n- Two'
          }}
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

  it('shows thinking indicator for latest assistant bubble only', () => {
    const { rerender } = render(
      <ul>
        <ChatBubble
          item={{
            id: 'assistant-2',
            roleClassName: 'assistant',
            text: 'Working...'
          }}
          showThinking={true}
          isLatestAssistant={true}
        />
      </ul>
    );

    expect(screen.getByText('-----thinking-----')).toBeTruthy();

    rerender(
      <ul>
        <ChatBubble
          item={{
            id: 'assistant-2',
            roleClassName: 'assistant',
            text: 'Working...'
          }}
          showThinking={true}
          isLatestAssistant={false}
        />
      </ul>
    );

    expect(screen.queryByText('-----thinking-----')).toBeNull();
  });
});
