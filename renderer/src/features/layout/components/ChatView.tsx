import { useAppState } from '../../../state';

export function ChatView() {
  const state = useAppState();

  return (
    <section className="chat-view" data-testid="chat-view" aria-label="Chat view">
      <h2>Chat</h2>
      {state.chat.messages.length > 0 ? (
        <ul>
          {state.chat.messages.map((message) => (
            <li key={message.id}>
              [{message.role}] {message.content}
            </li>
          ))}
        </ul>
      ) : (
        <p>System messages will appear here.</p>
      )}
    </section>
  );
}
