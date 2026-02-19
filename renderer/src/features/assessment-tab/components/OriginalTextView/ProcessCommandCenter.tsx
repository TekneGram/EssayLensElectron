import type { ActiveCommand } from '../../types';

interface ProcessCommandCenterProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  onClearSelection: () => void;
  onSelectCommand: (command: ActiveCommand) => void;
}

export function ProcessCommandCenter({ isOpen, onToggle, onClearSelection, onSelectCommand }: ProcessCommandCenterProps) {
  return (
    <div className="process-command-center" data-testid="process-command-center" data-open={String(isOpen)}>
      <button type="button" onClick={() => onToggle(!isOpen)} aria-expanded={isOpen}>
        {isOpen ? 'Hide Process Center' : 'Show Process Center'}
      </button>
      {isOpen ? (
        <div className="process-command-actions">
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
          <button
            type="button"
            onClick={() =>
              onSelectCommand({
                id: 'check-hedging',
                label: 'Check Hedging',
                source: 'process-center'
              })
            }
          >
            Check Hedging
          </button>
        </div>
      ) : null}
    </div>
  );
}
