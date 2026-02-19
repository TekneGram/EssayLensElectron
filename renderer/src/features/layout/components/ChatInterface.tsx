import type { ChatInterfaceProps as AssessmentChatInterfaceProps } from '../../assessment-tab/types';

interface ChatInterfaceProps extends Partial<AssessmentChatInterfaceProps> {
  onChatIntent: () => void;
}

export function ChatInterface({
  activeCommand = null,
  chatMode = 'comment',
  draftText = '',
  isModeLockedToChat = false,
  onChatIntent,
  onDraftChange,
  onModeChange,
  onSubmit
}: ChatInterfaceProps) {
  return (
    <section className="chat-interface pane" data-testid="chat-interface" aria-label="Chat interface">
      <div hidden data-testid="assessment-chat-interface-stub">
        {`${chatMode}:${isModeLockedToChat}:${activeCommand?.id ?? 'no-command'}`}
      </div>
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
      <button
        className="chat-send"
        type="button"
        aria-label="Switch to comment mode"
        disabled={isModeLockedToChat}
        onClick={() => onModeChange?.('comment')}
      >
        Comment
      </button>
      <button className="chat-send" type="button" aria-label="Switch to chat mode" onClick={() => onModeChange?.('chat')}>
        Chat
      </button>
      <button className="chat-send" type="button" aria-label="Send message" onClick={onChatIntent}>
        Send
      </button>
      <button className="chat-send" type="button" aria-label="Submit draft" onClick={() => onSubmit?.()}>
        Submit
      </button>
    </section>
  );
}
