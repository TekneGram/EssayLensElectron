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
  return (
    <section className="chat-interface pane" data-testid="chat-interface" aria-label="Chat interface">
      <div hidden data-testid="assessment-chat-interface-stub">
        {`${chatMode}:${isModeLockedToChat}:${activeCommand?.id ?? 'no-command'}`}
      </div>
      <CommandDisplay activeCommand={activeCommand} />
      <HighlightedTextDisplay pendingSelection={pendingSelection} />
      <ChatInput draftText={draftText} onDraftChange={onDraftChange} onChatIntent={onChatIntent} />
      <CommandDropdown activeCommand={activeCommand} onCommandSelected={onCommandSelected} />
      <ChatToggle isModeLockedToChat={isModeLockedToChat} onModeChange={onModeChange} />
      <button className="chat-send" type="button" aria-label="Send message" onClick={onChatIntent}>
        Send
      </button>
      <button className="chat-send" type="button" aria-label="Submit draft" onClick={() => onSubmit?.()}>
        Submit
      </button>
    </section>
  );
}
