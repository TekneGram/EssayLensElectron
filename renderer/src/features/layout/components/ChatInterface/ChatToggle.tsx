import type { ChatMode } from '../../../assessment-tab/types';

interface ChatToggleProps {
  isModeLockedToChat?: boolean;
  onModeChange?: (mode: ChatMode) => void;
}

export function ChatToggle({ isModeLockedToChat = false, onModeChange }: ChatToggleProps) {
  return (
    <>
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
    </>
  );
}
