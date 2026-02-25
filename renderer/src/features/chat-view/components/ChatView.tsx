import { useAppState } from '../../../state';
import { selectChatMessages } from '../state';

interface ChatViewProps {
  onCollapse: () => void;
}

export function ChatView({ onCollapse }: ChatViewProps) {
  const state = useAppState();
  const messages = selectChatMessages(state);

  return (
    <section className="chat-view pane chat" data-testid="chat-view" aria-label="Chat view">
      <div className="chat-head">
        <h3>ChatView</h3>
        <button className="chat-toggle chat-toggle-collapse" type="button" aria-label="Collapse chat panel" onClick={onCollapse}>
          ‹
        </button>
      </div>
      {messages.length > 0 ? (
        <ul className="chat-log">
          {messages.map((message) => (
            <li key={message.id} className={`msg ${message.role}`}>
              [{message.role}] {message.content}
            </li>
          ))}
        </ul>
      ) : (
        <p className="content-block">System messages will appear here.</p>
      )}
    </section>
  );
}
