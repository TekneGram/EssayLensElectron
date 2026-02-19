import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChatInterface } from '../components/ChatInterface';

describe('ChatInterface toggle lock rules', () => {
  it('disables switching to comment mode while lock is active', () => {
    const onModeChange = vi.fn();

    render(
      <ChatInterface
        chatMode="chat"
        isModeLockedToChat
        onModeChange={onModeChange}
        onChatIntent={vi.fn()}
      />
    );

    const commentButton = screen.getByRole('button', { name: 'Switch to comment mode' });
    const chatButton = screen.getByRole('button', { name: 'Switch to chat mode' });

    expect(commentButton.getAttribute('disabled')).not.toBeNull();
    fireEvent.click(commentButton);
    expect(onModeChange).not.toHaveBeenCalledWith('comment');

    fireEvent.click(chatButton);
    expect(onModeChange).toHaveBeenCalledWith('chat');
  });

  it('allows mode switches when lock is inactive', () => {
    const onModeChange = vi.fn();

    render(
      <ChatInterface
        chatMode="chat"
        isModeLockedToChat={false}
        onModeChange={onModeChange}
        onChatIntent={vi.fn()}
      />
    );

    const commentButton = screen.getByRole('button', { name: 'Switch to comment mode' });
    expect(commentButton.getAttribute('disabled')).toBeNull();

    fireEvent.click(commentButton);
    fireEvent.click(screen.getByRole('button', { name: 'Switch to chat mode' }));

    expect(onModeChange).toHaveBeenCalledWith('comment');
    expect(onModeChange).toHaveBeenCalledWith('chat');
  });
});
