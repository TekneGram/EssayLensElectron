import type { ActiveCommand } from '../../../assessment-tab/types';

interface CommandDisplayProps {
  activeCommand?: ActiveCommand | null;
}

export function CommandDisplay({ activeCommand = null }: CommandDisplayProps) {
  return <div hidden data-testid="command-display-stub">{activeCommand?.label ?? 'No command selected'}</div>;
}
