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
  const submitLabel = chatMode === 'comment' ? 'Add Comment' : 'Send Chat';
  const handleSubmit = () => {
    onChatIntent();
    void onSubmit?.();
  };

  return (
    <section className="chat-interface pane" data-testid="chat-interface" aria-label="Chat interface">
      <div hidden data-testid="assessment-chat-interface-stub">
        {`${chatMode}:${isModeLockedToChat}:${activeCommand?.id ?? 'no-command'}`}
      </div>
      <CommandDisplay activeCommand={activeCommand} />
      <HighlightedTextDisplay pendingSelection={pendingSelection} />
      <ChatInput draftText={draftText} onDraftChange={onDraftChange} onChatIntent={onChatIntent} onSubmit={handleSubmit} />
      <div className="chat-interface-controls">
        <CommandDropdown activeCommand={activeCommand} onCommandSelected={onCommandSelected} />
        <ChatToggle chatMode={chatMode} isModeLockedToChat={isModeLockedToChat} onModeChange={onModeChange} />
        <button className="chat-send" type="button" aria-label="Send message" onClick={handleSubmit}>
          {submitLabel}
        </button>
      </div>
    </section>
  );
}
