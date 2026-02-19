import { useEffect } from 'react';
import type { MutableRefObject } from 'react';
import type { PendingSelection } from '../../../types';
import { buildRangeFromAnchors, type RenderBridge } from '../services/renderBridge';
import type { LoadedTextViewDocument } from './useTextViewDocument';

interface UseTextViewFocusArgs {
  activeCommentId: string | null;
  pendingSelection: PendingSelection | null;
  document: LoadedTextViewDocument | null;
  bridgeRef: MutableRefObject<RenderBridge | null>;
}

export function useTextViewFocus({
  activeCommentId,
  pendingSelection,
  document,
  bridgeRef
}: UseTextViewFocusArgs): void {
  useEffect(() => {
    if (!activeCommentId || !pendingSelection || !document || !bridgeRef.current) {
      return;
    }

    const range = buildRangeFromAnchors(
      pendingSelection.startAnchor,
      pendingSelection.endAnchor,
      bridgeRef.current,
      document.textMap
    );

    if (!range) {
      return;
    }

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    range.startContainer.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeCommentId, bridgeRef, document, pendingSelection]);
}
