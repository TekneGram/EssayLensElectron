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
  const handleSubmit = () => {
    onChatIntent();
    void onSubmit?.();
  };

  return (
    <section className="chat-interface pane" data-testid="chat-interface" aria-label="Chat interface">
      <div hidden data-testid="assessment-chat-interface-stub">
        {`${chatMode}:${isModeLockedToChat}:${activeCommand?.id ?? 'no-command'}`}
      </div>

      <div className="chat-interface-row chat-interface-row-top">
        <CommandDisplay activeCommand={activeCommand} onClearCommand={() => onCommandSelected?.(null)} />
      </div>

      <div className="chat-interface-row chat-interface-row-middle">
        <div className="chat-interface-cell chat-interface-cell-command">
          <CommandDropdown activeCommand={activeCommand} onCommandSelected={onCommandSelected} />
        </div>
        <div className="chat-interface-cell chat-interface-cell-input">
          <ChatInput draftText={draftText} onDraftChange={onDraftChange} onChatIntent={onChatIntent} onSubmit={handleSubmit} />
        </div>
        <div className="chat-interface-cell chat-interface-cell-send">
          <button className="chat-send" type="button" aria-label="Send message" onClick={handleSubmit}>
            ➤
          </button>
        </div>
      </div>

      <div className="chat-interface-row chat-interface-row-bottom">
        <div className="chat-interface-cell chat-interface-cell-toggle">
          <ChatToggle chatMode={chatMode} isModeLockedToChat={isModeLockedToChat} onModeChange={onModeChange} />
        </div>
        <div className="chat-interface-cell chat-interface-cell-highlight">
          <HighlightedTextDisplay pendingSelection={pendingSelection} />
        </div>
      </div>
    </section>
  );
}
