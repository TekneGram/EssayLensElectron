import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChatInterface } from '../components/ChatInterface';

describe('ChatInterface toggle lock rules', () => {
  it('keeps chat mode locked while lock is active', () => {
    const onModeChange = vi.fn();

    render(
      <ChatInterface
        chatMode="chat"
        isModeLockedToChat
        onModeChange={onModeChange}
        onChatIntent={vi.fn()}
      />
    );

    const modeSwitch = screen.getByRole('switch', { name: 'Switch chat mode' });

    expect(modeSwitch.getAttribute('disabled')).not.toBeNull();
    fireEvent.click(modeSwitch);
    expect(onModeChange).not.toHaveBeenCalled();
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

    const modeSwitch = screen.getByRole('switch', { name: 'Switch chat mode' });
    expect(modeSwitch.getAttribute('disabled')).toBeNull();

    fireEvent.click(modeSwitch);

    expect(onModeChange).toHaveBeenCalledWith('comment');
  });
});
