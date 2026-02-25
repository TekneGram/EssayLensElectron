import type { WordAnchor, WordParagraphUnit, WordTextMap } from './textMapTypes';

type NodePosition = {
  node: Text;
  offset: number;
};

export type RenderBridge = {
  paragraphToIndex: WeakMap<HTMLElement, number>;
  indexToParagraph: Map<number, HTMLElement>;
};

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

function collectParagraphCandidates(container: HTMLElement): HTMLElement[] {
  let candidates = Array.from(
    container.querySelectorAll<HTMLElement>('p, li, td, th, h1, h2, h3, h4, h5, h6')
  );

  if (candidates.length === 0) {
    candidates = Array.from(container.querySelectorAll<HTMLElement>('div'));
  }

  return candidates.filter((el) => normalizeText(el.textContent ?? '').length > 0);
}

function scoreMatch(a: string, b: string): number {
  if (a === b) {
    return 1;
  }
  if (!a || !b) {
    return 0;
  }
  if (a.includes(b) || b.includes(a)) {
    return Math.min(a.length, b.length) / Math.max(a.length, b.length);
  }

  const minLen = Math.min(a.length, b.length);
  let prefix = 0;
  while (prefix < minLen && a[prefix] === b[prefix]) {
    prefix += 1;
  }

  return prefix / Math.max(a.length, b.length);
}

function mapParagraphElements(
  domParagraphs: HTMLElement[],
  ooxmlParagraphs: WordParagraphUnit[]
): { paragraphToIndex: WeakMap<HTMLElement, number>; indexToParagraph: Map<number, HTMLElement> } {
  const paragraphToIndex = new WeakMap<HTMLElement, number>();
  const indexToParagraph = new Map<number, HTMLElement>();

  let cursor = 0;
  const maxLookahead = 120;

  for (const domParagraph of domParagraphs) {
    const domText = normalizeText(domParagraph.textContent ?? '');
    if (!domText) {
      continue;
    }

    let bestIdx = -1;
    let bestScore = 0;
    const end = Math.min(ooxmlParagraphs.length, cursor + maxLookahead);

    for (let i = cursor; i < end; i += 1) {
      const para = ooxmlParagraphs[i];
      const paraText = normalizeText(para.text);
      const score = scoreMatch(domText, paraText);

      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }

      if (score === 1) {
        break;
      }
    }

    if (bestIdx >= 0 && bestScore >= 0.45) {
      const mappedIndex = ooxmlParagraphs[bestIdx].paragraphIndex;
      paragraphToIndex.set(domParagraph, mappedIndex);
      if (!indexToParagraph.has(mappedIndex)) {
        indexToParagraph.set(mappedIndex, domParagraph);
      }
      cursor = bestIdx + 1;
    }
  }

  return { paragraphToIndex, indexToParagraph };
}

function findMappedParagraphElement(node: Node, bridge: RenderBridge): HTMLElement | null {
  let current: Node | null = node.nodeType === 1 ? node : node.parentNode;
  while (current) {
    if (current.nodeType === 1) {
      const el = current as HTMLElement;
      if (bridge.paragraphToIndex.has(el)) {
        return el;
      }
    }
    current = current.parentNode;
  }
  return null;
}

function resolveTextPosition(node: Node, offset: number): NodePosition | null {
  if (node.nodeType === 3) {
    const textNode = node as Text;
    return {
      node: textNode,
      offset: Math.max(0, Math.min(offset, textNode.nodeValue?.length ?? 0))
    };
  }

  if (node.nodeType !== 1) {
    return null;
  }

  const el = node as Element;
  const child = el.childNodes[offset] ?? el.childNodes[Math.max(0, offset - 1)];
  if (!child) {
    return null;
  }

  if (child.nodeType === 3) {
    return { node: child as Text, offset: 0 };
  }

  const walker = document.createTreeWalker(child, NodeFilter.SHOW_TEXT);
  const textNode = walker.nextNode() as Text | null;
  if (!textNode) {
    return null;
  }
  return { node: textNode, offset: 0 };
}

function paragraphOffsetFromPosition(paragraphEl: HTMLElement, node: Node, offset: number): number {
  const range = document.createRange();
  range.selectNodeContents(paragraphEl);
  range.setEnd(node, offset);
  return range.toString().length;
}

function paragraphOffsetToAnchor(paragraph: WordParagraphUnit, offset: number): WordAnchor | null {
  const bounded = Math.max(0, Math.min(offset, paragraph.totalLength));

  if (paragraph.units.length === 0) {
    return null;
  }

  if (bounded === paragraph.totalLength) {
    const last = paragraph.units[paragraph.units.length - 1];
    return {
      part: last.part,
      paragraphIndex: last.paragraphIndex,
      runIndex: last.runIndex,
      charOffset: last.text.length
    };
  }

  for (const unit of paragraph.units) {
    const start = unit.globalStart - paragraph.units[0].globalStart;
    const end = start + unit.text.length;
    if (bounded >= start && bounded < end) {
      return {
        part: unit.part,
        paragraphIndex: unit.paragraphIndex,
        runIndex: unit.runIndex,
        charOffset: bounded - start
      };
    }
  }

  const fallback = paragraph.units[paragraph.units.length - 1];
  return {
    part: fallback.part,
    paragraphIndex: fallback.paragraphIndex,
    runIndex: fallback.runIndex,
    charOffset: fallback.text.length
  };
}

function anchorToParagraphOffset(anchor: WordAnchor, paragraph: WordParagraphUnit): number | null {
  let base = 0;
  for (const unit of paragraph.units) {
    if (
      unit.part === anchor.part &&
      unit.paragraphIndex === anchor.paragraphIndex &&
      unit.runIndex === anchor.runIndex
    ) {
      return base + Math.max(0, Math.min(anchor.charOffset, unit.text.length));
    }
    base += unit.text.length;
  }
  return null;
}

function paragraphOffsetToDomPosition(paragraphEl: HTMLElement, targetOffset: number): NodePosition | null {
  const walker = document.createTreeWalker(paragraphEl, NodeFilter.SHOW_TEXT);
  let consumed = 0;

  let current = walker.nextNode();
  while (current) {
    const node = current as Text;
    const value = node.nodeValue ?? '';
    const end = consumed + value.length;

    if (targetOffset <= end) {
      return {
        node,
        offset: Math.max(0, Math.min(value.length, targetOffset - consumed))
      };
    }

    consumed = end;
    current = walker.nextNode();
  }

  return null;
}

export function buildRenderBridge(container: HTMLElement, textMap: WordTextMap): RenderBridge {
  const domParagraphs = collectParagraphCandidates(container);
  const mapped = mapParagraphElements(domParagraphs, textMap.paragraphs);

  return {
    paragraphToIndex: mapped.paragraphToIndex,
    indexToParagraph: mapped.indexToParagraph
  };
}

function positionToAnchor(node: Node, offset: number, bridge: RenderBridge, textMap: WordTextMap): WordAnchor | null {
  const textPosition = resolveTextPosition(node, offset);
  if (!textPosition) {
    return null;
  }

  const paragraphEl = findMappedParagraphElement(textPosition.node, bridge);
  if (!paragraphEl) {
    return null;
  }

  const paragraphIndex = bridge.paragraphToIndex.get(paragraphEl);
  if (paragraphIndex === undefined) {
    return null;
  }

  const paragraph = textMap.paragraphs.find((item) => item.paragraphIndex === paragraphIndex);
  if (!paragraph) {
    return null;
  }

  const paragraphOffset = paragraphOffsetFromPosition(paragraphEl, textPosition.node, textPosition.offset);
  return paragraphOffsetToAnchor(paragraph, paragraphOffset);
}

export function selectionToAnchors(
  selection: Selection,
  bridge: RenderBridge,
  textMap: WordTextMap
): {
  start: WordAnchor;
  end: WordAnchor;
} | null {
  if (selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  if (range.collapsed) {
    return null;
  }

  const start = positionToAnchor(range.startContainer, range.startOffset, bridge, textMap);
  const end = positionToAnchor(range.endContainer, range.endOffset, bridge, textMap);

  if (!start || !end) {
    return null;
  }

  return { start, end };
}

export function buildRangeFromAnchors(
  start: WordAnchor,
  end: WordAnchor,
  bridge: RenderBridge,
  textMap: WordTextMap
): Range | null {
  const startParagraph = textMap.paragraphs.find((item) => item.paragraphIndex === start.paragraphIndex);
  const endParagraph = textMap.paragraphs.find((item) => item.paragraphIndex === end.paragraphIndex);
  if (!startParagraph || !endParagraph) {
    return null;
  }

  const startEl = bridge.indexToParagraph.get(start.paragraphIndex);
  const endEl = bridge.indexToParagraph.get(end.paragraphIndex);
  if (!startEl || !endEl) {
    return null;
  }

  const startOffset = anchorToParagraphOffset(start, startParagraph);
  const endOffset = anchorToParagraphOffset(end, endParagraph);
  if (startOffset === null || endOffset === null) {
    return null;
  }

  const startPos = paragraphOffsetToDomPosition(startEl, startOffset);
  const endPos = paragraphOffsetToDomPosition(endEl, endOffset);
  if (!startPos || !endPos) {
    return null;
  }

  const range = document.createRange();
  range.setStart(startPos.node, startPos.offset);
  range.setEnd(endPos.node, endPos.offset);
  return range;
}
