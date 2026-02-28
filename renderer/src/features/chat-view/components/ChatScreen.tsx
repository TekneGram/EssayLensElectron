import type { ChatViewMessageItem } from '../application/chatView.service';
import { toLatestAssistantIndex, toStreamRenderKey } from '../application/chatScreen.service';
import { useChatScreenAutoScroll } from '../hooks/useChatScreenAutoScroll';
import { ChatBubble } from './ChatBubble';

interface ChatScreenProps {
  items: ChatViewMessageItem[];
  isLoading: boolean;
  error?: string;
  showThinking?: boolean;
}

export function ChatScreen({ items, isLoading, error, showThinking = false }: ChatScreenProps) {
  const streamRenderKey = toStreamRenderKey(items);
  const { listRef, bottomRef, handleScroll } = useChatScreenAutoScroll({ streamRenderKey, showThinking });

  if (isLoading) {
    return <p className="content-block">Loading chat messages...</p>;
  }

  if (error) {
    return <p className="content-block">{error}</p>;
  }

  if (items.length === 0) {
    return <p className="content-block">No messages in this chat yet.</p>;
  }

  const latestAssistantIndex = toLatestAssistantIndex(items);

  return (
    <ul ref={listRef} className="chat-log" data-testid="chat-screen" onScroll={handleScroll}>
      {items.map((item, index) => (
        <ChatBubble key={item.id} item={item} showThinking={showThinking} isLatestAssistant={latestAssistantIndex === index} />
      ))}
      <li ref={bottomRef} aria-hidden="true" className="chat-log-end" data-testid="chat-screen-end" />
    </ul>
  );
}
