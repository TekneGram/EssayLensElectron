export function ChatInterface() {
  return (
    <section className="chat-interface" data-testid="chat-interface" aria-label="Chat interface">
      <label htmlFor="chat-input">Message</label>
      <textarea id="chat-input" rows={3} placeholder="Type feedback command..." />
      <button type="button">Send</button>
    </section>
  );
}
