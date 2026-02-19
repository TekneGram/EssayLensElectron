import { useEffect, useRef } from 'react';
import type { PendingSelection } from '../../types';
import { useTextViewDocument } from './hooks/useTextViewDocument';
import { useTextViewFocus } from './hooks/useTextViewFocus';
import { useTextViewSelection } from './hooks/useTextViewSelection';

interface TextViewWindowProps {
  selectedFileId: string | null;
  text: string;
  pendingQuote?: string;
  pendingSelection?: PendingSelection | null;
  activeCommentId?: string | null;
  onSelectionCaptured: (selection: PendingSelection | null) => void;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function clipContext(text: string, target: string, offsetDirection: 'prefix' | 'suffix'): string {
  const normalizedText = normalizeWhitespace(text);
  const normalizedTarget = normalizeWhitespace(target);
  if (!normalizedTarget) {
    return '';
  }
  const start = normalizedText.indexOf(normalizedTarget);
  if (start < 0) {
    return '';
  }
  const boundary = 40;
  if (offsetDirection === 'prefix') {
    return normalizedText.slice(Math.max(0, start - boundary), start);
  }
  return normalizedText.slice(start + normalizedTarget.length, start + normalizedTarget.length + boundary);
}

function findParagraph(node: Node): HTMLElement | null {
  let current: Node | null = node;
  while (current) {
    if (current instanceof HTMLElement && current.dataset.paragraphIndex) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

function getParagraphCharOffset(paragraph: HTMLElement, node: Node, offset: number): number {
  const range = document.createRange();
  range.selectNodeContents(paragraph);
  range.setEnd(node, offset);
  return range.toString().length;
}

export function TextViewWindow({
  selectedFileId,
  text,
  pendingQuote,
  pendingSelection = null,
  activeCommentId = null,
  onSelectionCaptured
}: TextViewWindowProps) {
  const paragraphs = text.split(/\n+/).filter((paragraph) => paragraph.trim().length > 0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const windowRef = useRef<HTMLDivElement | null>(null);
  const previousFocusedParagraph = useRef<HTMLElement | null>(null);

  const { document, bridgeRef, statusMessage, isLoading } = useTextViewDocument({
    selectedFileId,
    containerRef,
    onSelectionCleared: () => onSelectionCaptured(null)
  });

  const { captureSelection } = useTextViewSelection({
    document,
    bridgeRef,
    onSelectionCaptured
  });

  useTextViewFocus({
    activeCommentId,
    pendingSelection,
    document,
    bridgeRef
  });

  useEffect(() => {
    const root = windowRef.current;
    if (!root || document || !activeCommentId || !pendingSelection) {
      return;
    }

    const startIndex = pendingSelection.startAnchor.paragraphIndex;
    const startParagraph = root.querySelector<HTMLElement>(`[data-paragraph-index="${startIndex}"]`);
    if (!startParagraph) {
      return;
    }

    if (previousFocusedParagraph.current && previousFocusedParagraph.current !== startParagraph) {
      previousFocusedParagraph.current.classList.remove('text-paragraph-focused');
    }
    startParagraph.classList.add('text-paragraph-focused');
    previousFocusedParagraph.current = startParagraph;
    if (typeof startParagraph.scrollIntoView === 'function') {
      startParagraph.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [activeCommentId, document, pendingSelection]);

  const captureFallbackSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      onSelectionCaptured(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const exactQuote = normalizeWhitespace(range.toString());
    if (!exactQuote) {
      onSelectionCaptured(null);
      return;
    }

    const startParagraph = findParagraph(range.startContainer);
    const endParagraph = findParagraph(range.endContainer);
    if (!startParagraph || !endParagraph) {
      onSelectionCaptured(null);
      return;
    }

    const startParagraphIndex = Number(startParagraph.dataset.paragraphIndex);
    const endParagraphIndex = Number(endParagraph.dataset.paragraphIndex);
    if (Number.isNaN(startParagraphIndex) || Number.isNaN(endParagraphIndex)) {
      onSelectionCaptured(null);
      return;
    }

    onSelectionCaptured({
      exactQuote,
      prefixText: clipContext(text, exactQuote, 'prefix'),
      suffixText: clipContext(text, exactQuote, 'suffix'),
      startAnchor: {
        part: 'renderer://original-text-view',
        paragraphIndex: startParagraphIndex,
        runIndex: 0,
        charOffset: getParagraphCharOffset(startParagraph, range.startContainer, range.startOffset)
      },
      endAnchor: {
        part: 'renderer://original-text-view',
        paragraphIndex: endParagraphIndex,
        runIndex: 0,
        charOffset: getParagraphCharOffset(endParagraph, range.endContainer, range.endOffset)
      }
    });
  };

  const captureCurrentSelection = () => {
    if (document) {
      captureSelection();
      return;
    }
    captureFallbackSelection();
  };

  return (
    <>
      {pendingQuote ? <div className="content-block">Pending quote: {pendingQuote}</div> : null}
      <div className="content-block">{isLoading ? 'Loading...' : statusMessage}</div>
      <div
        ref={windowRef}
        className="content-block"
        data-testid="text-view-window"
        onMouseUp={captureCurrentSelection}
        onKeyUp={captureCurrentSelection}
      >
        {document ? <div ref={containerRef} /> : null}
        {!document
          ? paragraphs.length > 0
            ? paragraphs.map((paragraph, index) => (
                <p key={`${paragraph.slice(0, 24)}-${index}`} data-paragraph-index={index}>
                  {paragraph}
                </p>
              ))
            : text
          : null}
      </div>
    </>
  );
}
