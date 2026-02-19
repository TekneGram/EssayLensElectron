import type { OriginalTextViewProps } from '../../types';
import { ProcessCommandCenter } from './ProcessCommandCenter';
import { TextViewWindow } from './TextViewWindow';

export function OriginalTextView({
  text,
  pendingSelection,
  isProcessCenterOpen,
  onSelectionCaptured,
  onCommandSelected,
  onToggleProcessCenter
}: OriginalTextViewProps) {
  return (
    <section className="original-text-view subpane" data-testid="original-text-view">
      <h4>OriginalTextView</h4>
      <ProcessCommandCenter
        isOpen={isProcessCenterOpen}
        onToggle={onToggleProcessCenter}
        onClearSelection={() => onSelectionCaptured(null)}
        onSelectCommand={onCommandSelected}
      />
      <TextViewWindow text={text} pendingQuote={pendingSelection?.exactQuote} />
    </section>
  );
}
