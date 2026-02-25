export { buildTextMapFromDocx } from './docxTextMap';
export { buildRangeFromAnchors, buildRenderBridge, selectionToAnchors } from './renderBridge';
export type { RenderBridge } from './renderBridge';
export type { WordAnchor, WordParagraphUnit, WordTextMap, WordTextUnit } from './textMapTypes';
export {
  addRangeToWindowSelection,
  clearWindowSelection,
  findParagraph,
  getActiveWindowSelection,
  getParagraphCharOffset
} from './windowSelection';
