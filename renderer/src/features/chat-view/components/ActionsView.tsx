import type { ChatViewMessageItem } from '../application/chatView.service';

interface ActionsViewProps {
  items: ChatViewMessageItem[];
}

export function ActionsView({ items }: ActionsViewProps) {
  if (items.length === 0) {
    return <p className="content-block">System actions will appear here.</p>;
  }

  return (
    <ul className="chat-log" data-testid="actions-view">
      {items.map((item) => (
        <li key={item.id} className={`msg ${item.roleClassName}`}>
          {item.text}
        </li>
      ))}
    </ul>
  );
}
