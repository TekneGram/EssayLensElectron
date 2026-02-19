import type { ActiveCommand } from '../../types';

interface ProcessCommandCenterProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  onClearSelection: () => void;
  onSelectCommand: (command: ActiveCommand) => void;
}

export function ProcessCommandCenter({ isOpen, onToggle, onClearSelection, onSelectCommand }: ProcessCommandCenterProps) {
  return (
    <>
      <button type="button" onClick={() => onToggle(!isOpen)}>
        {isOpen ? 'Hide Process Center' : 'Show Process Center'}
      </button>
      <button type="button" onClick={onClearSelection}>
        Clear Selection
      </button>
      <button
        type="button"
        onClick={() =>
          onSelectCommand({
            id: 'evaluate-thesis',
            label: 'Evaluate Thesis',
            source: 'process-center'
          })
        }
      >
        Select Command
      </button>
    </>
  );
}
