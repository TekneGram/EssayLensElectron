import { useEffect, useMemo, useState } from 'react';
import { getChatBubbleThinkingMessage } from '../domain/chatBubbleThinking.domain';
import { CHAT_BUBBLE_THINKING_ROTATE_MS } from '../state/chatBubble.state';
import type { SessionSendPhase } from '../../chat-interface/domain/chatState.types';

export function useChatBubbleThinking(
  phase: SessionSendPhase | undefined,
  isVisible: boolean,
  rotateMs: number = CHAT_BUBBLE_THINKING_ROTATE_MS
): string {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setMessageIndex(0);
      return;
    }
    setMessageIndex(0);
  }, [isVisible, phase]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }
    const timerId = window.setInterval(() => {
      setMessageIndex((current) => current + 1);
    }, rotateMs);

    return () => {
      window.clearInterval(timerId);
    };
  }, [isVisible, rotateMs]);

  return useMemo(() => getChatBubbleThinkingMessage(messageIndex, phase), [messageIndex, phase]);
}
