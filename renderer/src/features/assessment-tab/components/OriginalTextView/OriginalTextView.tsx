import type { OriginalTextViewProps } from '../../types';
import { TextViewWindow } from './TextViewWindow';

export function OriginalTextView({
  selectedFileId,
  text,
  pendingSelection,
  activeCommentId,
  onSelectionCaptured
}: OriginalTextViewProps) {
  return (
    <section className="original-text-view subpane" data-testid="original-text-view">
      <h4>OriginalTextView</h4>
      <TextViewWindow
        selectedFileId={selectedFileId}
        text={text}
        pendingSelection={pendingSelection}
        activeCommentId={activeCommentId}
        onSelectionCaptured={onSelectionCaptured}
      />
    </section>
  );
}
