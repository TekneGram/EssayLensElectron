import type { ChatViewMessageItem } from '../application/chatView.service';

interface ChatScreenProps {
  items: ChatViewMessageItem[];
  isLoading: boolean;
  error?: string;
}

export function ChatScreen({ items, isLoading, error }: ChatScreenProps) {
  if (isLoading) {
    return <p className="content-block">Loading chat messages...</p>;
  }

  if (error) {
    return <p className="content-block">{error}</p>;
  }

  if (items.length === 0) {
    return <p className="content-block">No messages in this chat yet.</p>;
  }

  return (
    <ul className="chat-log" data-testid="chat-screen">
      {items.map((item) => (
        <li key={item.id} className={`msg ${item.roleClassName}`}>
          {item.text}
        </li>
      ))}
    </ul>
  );
}
