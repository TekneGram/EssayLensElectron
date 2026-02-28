import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatScreen } from '../components/ChatScreen';

const baseItems = [
  { id: 'teacher-1', roleClassName: 'teacher', text: 'First prompt' },
  { id: 'assistant-1', roleClassName: 'assistant', text: 'Partial' }
];

describe('ChatScreen autoscroll', () => {
  function mockScrollIntoView() {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView
    });
    return scrollIntoView;
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('autoscrolls when assistant text streams in', () => {
    const scrollIntoViewSpy = mockScrollIntoView();

    const { rerender } = render(<ChatScreen items={baseItems} isLoading={false} />);
    rerender(
      <ChatScreen
        items={[
          baseItems[0],
          { ...baseItems[1], text: 'Partial stream update' }
        ]}
        isLoading={false}
      />
    );

    expect(scrollIntoViewSpy).toHaveBeenCalled();
  });

  it('does not autoscroll when user scrolls away from bottom', () => {
    const scrollIntoViewSpy = mockScrollIntoView();

    const { rerender } = render(<ChatScreen items={baseItems} isLoading={false} />);
    const chatScreen = screen.getByTestId('chat-screen');

    Object.defineProperty(chatScreen, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(chatScreen, 'clientHeight', { configurable: true, value: 300 });
    Object.defineProperty(chatScreen, 'scrollTop', { configurable: true, value: 100 });
    fireEvent.scroll(chatScreen);
    scrollIntoViewSpy.mockClear();

    rerender(
      <ChatScreen
        items={[
          baseItems[0],
          { ...baseItems[1], text: 'Another chunk' }
        ]}
        isLoading={false}
      />
    );

    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
  });

  it('resumes autoscroll after user returns near bottom', () => {
    const scrollIntoViewSpy = mockScrollIntoView();

    const { rerender } = render(<ChatScreen items={baseItems} isLoading={false} />);
    const chatScreen = screen.getByTestId('chat-screen');

    Object.defineProperty(chatScreen, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(chatScreen, 'clientHeight', { configurable: true, value: 300 });
    Object.defineProperty(chatScreen, 'scrollTop', { configurable: true, value: 100 });
    fireEvent.scroll(chatScreen);

    Object.defineProperty(chatScreen, 'scrollTop', { configurable: true, value: 636 });
    fireEvent.scroll(chatScreen);
    scrollIntoViewSpy.mockClear();

    rerender(
      <ChatScreen
        items={[
          baseItems[0],
          { ...baseItems[1], text: 'Final chunk' }
        ]}
        isLoading={false}
      />
    );

    expect(scrollIntoViewSpy).toHaveBeenCalled();
  });
});
