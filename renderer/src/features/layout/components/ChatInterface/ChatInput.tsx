interface ChatInputProps {
  draftText?: string;
  onDraftChange?: (text: string) => void;
  onChatIntent: () => void;
}

export function ChatInput({ draftText = '', onDraftChange, onChatIntent }: ChatInputProps) {
  return (
    <>
      <label htmlFor="chat-input" className="visually-hidden">
        Message
      </label>
      <textarea
        id="chat-input"
        className="chat-input"
        rows={2}
        placeholder="Type command, feedback, or question to the assistant..."
        value={draftText}
        onChange={(event) => onDraftChange?.(event.target.value)}
        onFocus={onChatIntent}
      />
    </>
  );
}
