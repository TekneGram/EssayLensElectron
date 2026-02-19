import type { ActiveCommand } from '../../../assessment-tab/types';

interface CommandDisplayProps {
  activeCommand?: ActiveCommand | null;
  onClearCommand?: () => void;
}

export function CommandDisplay({ activeCommand = null, onClearCommand }: CommandDisplayProps) {
  if (!activeCommand) {
    return <div className="chat-command-display" data-testid="command-display" aria-hidden="true" />;
  }

  return (
    <div className="chat-command-display" data-testid="command-display">
      <span className="chat-command-display-label">{activeCommand.label}</span>
      <button
        className="chat-command-clear"
        type="button"
        aria-label="Clear selected command"
        onClick={onClearCommand}
      >
        ×
      </button>
    </div>
  );
}
