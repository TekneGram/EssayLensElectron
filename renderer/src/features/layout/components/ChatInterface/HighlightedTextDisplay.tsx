import type { PendingSelection } from '../../../assessment-tab/types';

interface HighlightedTextDisplayProps {
  pendingSelection?: PendingSelection | null;
}

export function HighlightedTextDisplay({ pendingSelection = null }: HighlightedTextDisplayProps) {
  const quote = pendingSelection?.exactQuote;
  const preview = quote ?? 'No selection';

  return (
    <div className="chat-highlighted-text" data-testid="highlighted-text-stub" title={quote ?? undefined}>
      {preview}
    </div>
  );
}
