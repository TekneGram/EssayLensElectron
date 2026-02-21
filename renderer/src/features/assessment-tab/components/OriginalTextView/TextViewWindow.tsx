import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { PendingSelection } from '../../types';
import { useTextViewDocument } from './hooks/useTextViewDocument';
import { useTextViewFocus } from './hooks/useTextViewFocus';
import { useTextViewSelection } from './hooks/useTextViewSelection';

interface TextViewWindowProps {
  selectedFileId: string | null;
  text: string;
  pendingSelection?: PendingSelection | null;
  activeCommentId?: string | null;
  onSelectionCaptured: (selection: PendingSelection | null) => void;
}

const MIN_ZOOM_PERCENT = 60;
const MAX_ZOOM_PERCENT = 140;
const ZOOM_STEP_PERCENT = 5;
const DEFAULT_ZOOM_PERCENT = 100;
const MIN_STAGE_GUTTER = 24;

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
  pendingSelection = null,
  activeCommentId = null,
  onSelectionCaptured
}: TextViewWindowProps) {
  const paragraphs = text.split(/\n+/).filter((paragraph) => paragraph.trim().length > 0);
  const [zoomPercent, setZoomPercent] = useState(DEFAULT_ZOOM_PERCENT);
  const [baseDocxSize, setBaseDocxSize] = useState({ width: 0, height: 0 });
  const [stageLayout, setStageLayout] = useState({ width: 0, height: 0, gutter: MIN_STAGE_GUTTER });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomContentRef = useRef<HTMLDivElement | null>(null);
  const windowRef = useRef<HTMLDivElement | null>(null);
  const previousFocusedParagraph = useRef<HTMLElement | null>(null);
  const previousStageSizeRef = useRef<{ width: number; height: number } | null>(null);
  const zoomLevel = zoomPercent / 100;

  const { document, bridgeRef } = useTextViewDocument({
    selectedFileId,
    containerRef,
    onSelectionCleared: () => onSelectionCaptured(null)
  });

  useEffect(() => {
    setBaseDocxSize({ width: 0, height: 0 });
    setStageLayout({ width: 0, height: 0, gutter: MIN_STAGE_GUTTER });
    previousStageSizeRef.current = null;
  }, [selectedFileId]);

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

  const resetZoom = () => {
    setZoomPercent(DEFAULT_ZOOM_PERCENT);
  };

  const updateZoom = (value: number) => {
    const clamped = Math.min(MAX_ZOOM_PERCENT, Math.max(MIN_ZOOM_PERCENT, value));
    setZoomPercent(clamped);
  };

  const cancelPendingComment = () => {
    onSelectionCaptured(null);
    const selection = window.getSelection();
    selection?.removeAllRanges();
  };

  const pendingQuotePreview = pendingSelection?.exactQuote
    ? pendingSelection.exactQuote.length > 180
      ? `${pendingSelection.exactQuote.slice(0, 180)}…`
      : pendingSelection.exactQuote
    : null;

  useEffect(() => {
    if (!document || !containerRef.current) {
      return;
    }

    const host = containerRef.current;
    const measure = () => {
      const wrapper = host.querySelector<HTMLElement>('.docx-wrapper');
      if (!wrapper) {
        return;
      }
      const width = Math.ceil(Math.max(wrapper.scrollWidth, wrapper.offsetWidth));
      const height = Math.ceil(Math.max(wrapper.scrollHeight, wrapper.offsetHeight));
      if (width > 0 && height > 0) {
        setBaseDocxSize((previous) => (previous.width === width && previous.height === height ? previous : { width, height }));
      }
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const wrapper = host.querySelector<HTMLElement>('.docx-wrapper');
    if (!wrapper) {
      return;
    }

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(wrapper);
    return () => {
      observer.disconnect();
    };
  }, [document]);

  useEffect(() => {
    if (!document || !windowRef.current || !zoomContentRef.current || baseDocxSize.width <= 0 || baseDocxSize.height <= 0) {
      return;
    }

    const viewport = windowRef.current;
    const zoomContent = zoomContentRef.current;

    const measureLayout = () => {
      const visualWidth = Math.ceil(zoomContent.getBoundingClientRect().width);
      const visualHeight = Math.ceil(zoomContent.getBoundingClientRect().height);
      if (visualWidth <= 0 || visualHeight <= 0) {
        return;
      }

      const centeredGutter = Math.max(0, Math.floor((viewport.clientWidth - visualWidth) / 2));
      const gutter = Math.max(MIN_STAGE_GUTTER, centeredGutter);
      const width = visualWidth + gutter * 2;
      const height = visualHeight;

      setStageLayout((previous) =>
        previous.width === width && previous.height === height && previous.gutter === gutter
          ? previous
          : { width, height, gutter }
      );
    };

    measureLayout();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      measureLayout();
    });
    observer.observe(viewport);
    observer.observe(zoomContent);
    return () => {
      observer.disconnect();
    };
  }, [baseDocxSize.height, baseDocxSize.width, document, zoomLevel]);

  useEffect(() => {
    if (!document || !windowRef.current || stageLayout.width <= 0 || stageLayout.height <= 0) {
      return;
    }

    const viewport = windowRef.current;
    const previous = previousStageSizeRef.current;

    if (previous && previous.width > 0 && previous.height > 0) {
      const centerRatioX = (viewport.scrollLeft + viewport.clientWidth / 2) / previous.width;
      const centerRatioY = (viewport.scrollTop + viewport.clientHeight / 2) / Math.max(previous.height, 1);

      const maxScrollLeft = Math.max(0, stageLayout.width - viewport.clientWidth);
      const maxScrollTop = Math.max(0, stageLayout.height - viewport.clientHeight);

      viewport.scrollLeft = Math.min(maxScrollLeft, Math.max(0, centerRatioX * stageLayout.width - viewport.clientWidth / 2));
      viewport.scrollTop = Math.min(maxScrollTop, Math.max(0, centerRatioY * stageLayout.height - viewport.clientHeight / 2));
    } else {
      viewport.scrollLeft = Math.max(0, (stageLayout.width - viewport.clientWidth) / 2);
      viewport.scrollTop = 0;
    }

    previousStageSizeRef.current = { width: stageLayout.width, height: stageLayout.height };
  }, [document, stageLayout.height, stageLayout.width]);

  return (
    <div className="text-view-shell">
      <div className="text-view-zoom-controls" role="group" aria-label="Document zoom controls">
        <label className="text-view-zoom-label" htmlFor="docx-zoom-slider">
          Zoom: {zoomPercent}%
        </label>
        <input
          id="docx-zoom-slider"
          className="text-view-zoom-slider"
          type="range"
          min={MIN_ZOOM_PERCENT}
          max={MAX_ZOOM_PERCENT}
          step={ZOOM_STEP_PERCENT}
          value={zoomPercent}
          onChange={(event) => updateZoom(Number(event.target.value))}
          disabled={!document}
          aria-label="Document zoom"
        />
        <button
          type="button"
          className="text-view-zoom-button text-view-zoom-reset"
          onClick={resetZoom}
          disabled={!document || zoomPercent === DEFAULT_ZOOM_PERCENT}
        >
          Reset
        </button>
      </div>
      <div
        ref={windowRef}
        className="content-block text-view-window"
        style={{ '--docx-zoom': `${zoomLevel}` } as CSSProperties}
        data-testid="text-view-window"
        onMouseUp={captureCurrentSelection}
        onKeyUp={captureCurrentSelection}
      >
        {document ? (
          <div
            className="docx-zoom-stage"
            style={
              {
                width: stageLayout.width > 0 ? `${stageLayout.width}px` : undefined,
                height: stageLayout.height > 0 ? `${stageLayout.height}px` : undefined,
                paddingInline: `${stageLayout.gutter}px`
              } as CSSProperties
            }
          >
            <div
              ref={zoomContentRef}
              className="docx-zoom-content"
              style={
                {
                  width: baseDocxSize.width > 0 ? `${baseDocxSize.width}px` : undefined
                } as CSSProperties
              }
            >
              <div ref={containerRef} className="docx-host" />
            </div>
          </div>
        ) : null}
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
      {pendingQuotePreview ? (
        <div className="pending-comment-banner" role="status" aria-live="polite">
          <div className="pending-comment-banner-header">
            <strong>Pending Comment</strong>
            <button
              type="button"
              className="pending-comment-cancel"
              aria-label="Cancel pending comment"
              onClick={cancelPendingComment}
              title="Cancel pending comment"
            >
              x
            </button>
          </div>
          <p title={pendingSelection?.exactQuote}>{pendingQuotePreview}</p>
        </div>
      ) : null}
    </div>
  );
}
