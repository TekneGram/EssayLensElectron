import type { PendingSelection } from '../../../assessment-tab/types';

interface HighlightedTextDisplayProps {
  pendingSelection?: PendingSelection | null;
}

export function HighlightedTextDisplay({ pendingSelection = null }: HighlightedTextDisplayProps) {
  const quote = pendingSelection?.exactQuote;
  const preview = quote ? quote.slice(0, 120) : 'No selection';

  return <div hidden data-testid="highlighted-text-stub">{preview}</div>;
}
