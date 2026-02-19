import type { ChatMode } from '../../../assessment-tab/types';

interface ChatToggleProps {
  chatMode?: ChatMode;
  isModeLockedToChat?: boolean;
  onModeChange?: (mode: ChatMode) => void;
}

export function ChatToggle({ chatMode = 'comment', isModeLockedToChat = false, onModeChange }: ChatToggleProps) {
  const nextMode: ChatMode = chatMode === 'comment' ? 'chat' : 'comment';

  return (
    <div className="chat-mode-toggle" role="group" aria-label="Chat mode">
      <div className="chat-mode-toggle-labels" aria-hidden="true">
        <span>comment</span>
        <span>chat</span>
      </div>
      <button
        className="chat-mode-toggle-track"
        type="button"
        role="switch"
        aria-label="Switch chat mode"
        aria-checked={chatMode === 'chat'}
        disabled={isModeLockedToChat && chatMode === 'chat'}
        onClick={() => onModeChange?.(nextMode)}
      >
        <span className="chat-mode-toggle-thumb" />
      </button>
    </div>
  );
}
