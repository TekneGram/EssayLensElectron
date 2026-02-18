interface ChatInterfaceProps {
  onChatIntent: () => void;
}

export function ChatInterface({ onChatIntent }: ChatInterfaceProps) {
  return (
    <section className="chat-interface pane" data-testid="chat-interface" aria-label="Chat interface">
      <label htmlFor="chat-input" className="visually-hidden">
        Message
      </label>
      <textarea
        id="chat-input"
        className="chat-input"
        rows={2}
        placeholder="Type command, feedback, or question to the assistant..."
        onFocus={onChatIntent}
      />
      <button className="chat-send" type="button" aria-label="Send message" onClick={onChatIntent}>
        Send
      </button>
    </section>
  );
}
