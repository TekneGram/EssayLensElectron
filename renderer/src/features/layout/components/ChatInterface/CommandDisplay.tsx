import type { ActiveCommand } from '../../../assessment-tab/types';

interface CommandDisplayProps {
  activeCommand?: ActiveCommand | null;
}

export function CommandDisplay({ activeCommand = null }: CommandDisplayProps) {
  return (
    <div className="chat-command-display" data-testid="command-display">
      <strong>Command:</strong> {activeCommand?.label ?? 'None'}
    </div>
  );
}
