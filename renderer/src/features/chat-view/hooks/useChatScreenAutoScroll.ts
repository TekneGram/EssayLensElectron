import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { CHAT_SCREEN_AUTO_SCROLL_THRESHOLD_PX } from '../state/chatScreen.state';
import { isContainerNearBottom } from '../domain/chatScreen.domain';

interface UseChatScreenAutoScrollParams {
  streamRenderKey: string;
  showThinking: boolean;
}

interface UseChatScreenAutoScrollResult {
  listRef: RefObject<HTMLUListElement>;
  bottomRef: RefObject<HTMLLIElement>;
  handleScroll: () => void;
}

export function useChatScreenAutoScroll({
  streamRenderKey,
  showThinking
}: UseChatScreenAutoScrollParams): UseChatScreenAutoScrollResult {
  const listRef = useRef<HTMLUListElement | null>(null);
  const bottomRef = useRef<HTMLLIElement | null>(null);
  const [shouldAutoFollow, setShouldAutoFollow] = useState(true);

  const handleScroll = useCallback(() => {
    const container = listRef.current;
    if (!container) {
      return;
    }
    setShouldAutoFollow(isContainerNearBottom(container, CHAT_SCREEN_AUTO_SCROLL_THRESHOLD_PX));
  }, []);

  useLayoutEffect(() => {
    if (!shouldAutoFollow) {
      return;
    }
    const endNode = bottomRef.current as (HTMLLIElement & { scrollIntoView?: (options?: ScrollIntoViewOptions) => void }) | null;
    if (typeof endNode?.scrollIntoView === 'function') {
      endNode.scrollIntoView({ block: 'end' });
    }
  }, [shouldAutoFollow, streamRenderKey, showThinking]);

  return {
    listRef,
    bottomRef,
    handleScroll
  };
}
