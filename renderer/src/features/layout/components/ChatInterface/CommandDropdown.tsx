import type { ActiveCommand } from '../../../assessment-tab/types';

interface CommandDropdownProps {
  activeCommand?: ActiveCommand | null;
  onCommandSelected?: (command: ActiveCommand | null) => void;
}

export function CommandDropdown({ activeCommand = null, onCommandSelected }: CommandDropdownProps) {
  return (
    <select
      className="chat-command-dropdown"
      aria-label="Select command"
      value={activeCommand?.id ?? ''}
      onChange={(event) => {
        if (!onCommandSelected) {
          return;
        }
        if (!event.target.value) {
          onCommandSelected(null);
          return;
        }
        onCommandSelected({
          id: event.target.value,
          label: event.target.selectedOptions[0]?.text ?? event.target.value,
          source: 'chat-dropdown'
        });
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <option value="">Command</option>
      <option value="evaluate-thesis">Evaluate Thesis</option>
      <option value="check-hedging">Check Hedging</option>
    </select>
  );
}
