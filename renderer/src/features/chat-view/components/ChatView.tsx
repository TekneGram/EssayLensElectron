import { toChatViewMessageItems } from '../application/chatView.service';
import { useChatViewState } from '../hooks/useChatViewState';
import { ChatScreen } from './ChatScreen';
import { ChatControl } from './ChatControl';
import { ChatListScreen } from './ChatListScreen';
import { ActionsView } from './ActionsView';

interface ChatViewProps {
  onCollapse: () => void;
}

export function ChatView({ onCollapse }: ChatViewProps) {
  const { messages } = useChatViewState();
  const items = toChatViewMessageItems(messages);

  return (
    <section className="chat-view pane chat" data-testid="chat-view" aria-label="Chat view">
      <div className="chat-head">
        <h3>ChatView</h3>
        <button className="chat-toggle chat-toggle-collapse" type="button" aria-label="Collapse chat panel" onClick={onCollapse}>
          ‹
        </button>
      </div>
      <div>
        {/* Place <ChatControl />
        <ChatListScreen />
        <ChatScreen />
        <ActionsView /> here */}
      </div>
      {items.length > 0 ? (
        <ul className="chat-log">
          {items.map((item) => (
            <li key={item.id} className={`msg ${item.roleClassName}`}>
              {item.text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="content-block">System messages will appear here.</p>
      )}
    </section>
  );
}
