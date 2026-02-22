import type { ChatInterfaceProps as AssessmentChatInterfaceProps } from '../../../assessment-tab/types';
import { ChatInput } from './ChatInput';
import { ChatToggle } from './ChatToggle';
import { CommandDisplay } from './CommandDisplay';
import { CommandDropdown } from './CommandDropdown';
import { HighlightedTextDisplay } from './HighlightedTextDisplay';

interface ChatInterfaceProps extends Partial<AssessmentChatInterfaceProps> {
  onChatIntent: () => void;
}

export function ChatInterface({
  activeCommand = null,
  pendingSelection = null,
  chatMode = 'comment',
  draftText = '',
  isModeLockedToChat = false,
  onChatIntent,
  onDraftChange,
  onModeChange,
  onSubmit,
  onCommandSelected
}: ChatInterfaceProps) {
  const submitAriaLabel = chatMode === 'comment' ? 'Send comment' : 'Send chat message';
  const hasActiveCommand = Boolean(activeCommand?.id);
  const handleSubmit = () => {
    if (chatMode === 'chat') {
      onChatIntent();
    }
    void onSubmit?.();
  };

  return (
    <section className="chat-interface pane" data-testid="chat-interface" aria-label="Chat interface">
      <div hidden data-testid="assessment-chat-interface-stub">
        {`${chatMode}:${isModeLockedToChat}:${activeCommand?.id ?? 'no-command'}`}
      </div>
      <div className="interface-area">
        <div className="top-row">
          <CommandDisplay
            activeCommand={activeCommand}
            isVisible={hasActiveCommand}
            onClearCommand={() => onCommandSelected?.(null)}
          />
          <ChatToggle chatMode={chatMode} isModeLockedToChat={isModeLockedToChat} onModeChange={onModeChange} />
        </div>
        <div className="middle-row">
          <CommandDropdown activeCommand={activeCommand} onCommandSelected={onCommandSelected} />
          <ChatInput draftText={draftText} onDraftChange={onDraftChange} onSubmit={handleSubmit} />
          <button className="chat-send" type="button" aria-label={submitAriaLabel} onClick={handleSubmit}>
            {chatMode === 'comment' ? (
              <svg className="chat-send-icon chat-send-icon--comment" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M4 7h8M4 11h6M4 15h4" />
                <path d="M17.5 18V7.5" />
                <path d="M14.5 10.5l3-3 3 3" />
              </svg>
            ) : (
              <svg className="chat-send-icon chat-send-icon--chat" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 18V6.5" />
                <path d="M9 9.5l3-3 3 3" />
              </svg>
            )}
          </button>
        </div>
        <div className="bottom-row">
          <HighlightedTextDisplay pendingSelection={pendingSelection} />
        </div>
      </div>
    </section>
  );
}
