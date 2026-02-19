import type { ChatMode } from '../../../assessment-tab/types';

interface ChatToggleProps {
  chatMode?: ChatMode;
  isModeLockedToChat?: boolean;
  onModeChange?: (mode: ChatMode) => void;
}

export function ChatToggle({ chatMode = 'comment', isModeLockedToChat = false, onModeChange }: ChatToggleProps) {
  return (
    <div className="chat-toggle-group" role="group" aria-label="Chat mode">
      <button
        className="chat-send"
        type="button"
        aria-label="Switch to comment mode"
        aria-pressed={chatMode === 'comment'}
        disabled={isModeLockedToChat}
        onClick={() => onModeChange?.('comment')}
      >
        Comment
      </button>
      <button
        className="chat-send"
        type="button"
        aria-label="Switch to chat mode"
        aria-pressed={chatMode === 'chat'}
        onClick={() => onModeChange?.('chat')}
      >
        Chat
      </button>
    </div>
  );
}
