import { appErr } from '../../shared/appResult';
import type {
  AddFeedbackRequest,
  ExtractDocumentRequest,
  FeedbackAnchorDto,
  ListFeedbackRequest,
  RequestLlmAssessmentRequest
} from '../../shared/assessmentContracts';
import { notImplementedResult } from './result';
import type { IpcMainLike } from './types';

export const ASSESSMENT_CHANNELS = {
  extractDocument: 'assessment/extractDocument',
  listFeedback: 'assessment/listFeedback',
  addFeedback: 'assessment/addFeedback',
  requestLlmAssessment: 'assessment/requestLlmAssessment'
} as const;

function normalizeNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function hasOwnProperty(candidate: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(candidate, key);
}

function normalizeAnchor(value: unknown): FeedbackAnchorDto | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (typeof candidate.part !== 'string' || candidate.part.trim().length === 0) {
    return null;
  }

  const paragraphIndex = candidate.paragraphIndex;
  const runIndex = candidate.runIndex;
  const charOffset = candidate.charOffset;
  if (
    typeof paragraphIndex !== 'number' ||
    typeof runIndex !== 'number' ||
    typeof charOffset !== 'number' ||
    !Number.isInteger(paragraphIndex) ||
    !Number.isInteger(runIndex) ||
    !Number.isInteger(charOffset)
  ) {
    return null;
  }
  if (paragraphIndex < 0 || runIndex < 0 || charOffset < 0) {
    return null;
  }

  return {
    part: candidate.part.trim(),
    paragraphIndex,
    runIndex,
    charOffset
  };
}

function compareAnchorPosition(startAnchor: FeedbackAnchorDto, endAnchor: FeedbackAnchorDto): number | null {
  if (startAnchor.part !== endAnchor.part) {
    return null;
  }
  if (startAnchor.paragraphIndex !== endAnchor.paragraphIndex) {
    return startAnchor.paragraphIndex - endAnchor.paragraphIndex;
  }
  if (startAnchor.runIndex !== endAnchor.runIndex) {
    return startAnchor.runIndex - endAnchor.runIndex;
  }
  return startAnchor.charOffset - endAnchor.charOffset;
}

function normalizeExtractDocumentRequest(request: unknown): ExtractDocumentRequest | null {
  if (typeof request !== 'object' || request === null) {
    return null;
  }

  const candidate = request as Record<string, unknown>;
  const fileId = normalizeNonEmptyString(candidate.fileId);
  if (!fileId) {
    return null;
  }

  return { fileId };
}

function normalizeListFeedbackRequest(request: unknown): ListFeedbackRequest | null {
  if (typeof request !== 'object' || request === null) {
    return null;
  }

  const candidate = request as Record<string, unknown>;
  const fileId = normalizeNonEmptyString(candidate.fileId);
  if (!fileId) {
    return null;
  }

  return { fileId };
}

function normalizeRequestLlmAssessmentRequest(request: unknown): RequestLlmAssessmentRequest | null {
  if (typeof request !== 'object' || request === null) {
    return null;
  }

  const candidate = request as Record<string, unknown>;
  const fileId = normalizeNonEmptyString(candidate.fileId);
  if (!fileId) {
    return null;
  }

  if (hasOwnProperty(candidate, 'instruction')) {
    if (typeof candidate.instruction !== 'string') {
      return null;
    }
    const instruction = candidate.instruction.trim();
    return {
      fileId,
      instruction: instruction.length > 0 ? instruction : undefined
    };
  }

  return { fileId };
}

function normalizeAddFeedbackRequest(request: unknown): AddFeedbackRequest | null {
  if (typeof request !== 'object' || request === null) {
    return null;
  }

  const candidate = request as Record<string, unknown>;
  const fileId = normalizeNonEmptyString(candidate.fileId);
  const source = candidate.source;
  const kind = candidate.kind;
  const commentText = normalizeNonEmptyString(candidate.commentText);
  if (!fileId || (source !== 'teacher' && source !== 'llm') || !commentText) {
    return null;
  }
  if (kind !== 'inline' && kind !== 'block') {
    return null;
  }

  const hasInlineOnlyFields =
    hasOwnProperty(candidate, 'exactQuote') ||
    hasOwnProperty(candidate, 'prefixText') ||
    hasOwnProperty(candidate, 'suffixText') ||
    hasOwnProperty(candidate, 'startAnchor') ||
    hasOwnProperty(candidate, 'endAnchor');

  if (kind === 'block') {
    if (hasInlineOnlyFields) {
      return null;
    }
    return {
      fileId,
      source,
      kind,
      commentText
    };
  }

  const exactQuote = typeof candidate.exactQuote === 'string' ? candidate.exactQuote : null;
  const prefixText = typeof candidate.prefixText === 'string' ? candidate.prefixText : null;
  const suffixText = typeof candidate.suffixText === 'string' ? candidate.suffixText : null;
  const startAnchor = normalizeAnchor(candidate.startAnchor);
  const endAnchor = normalizeAnchor(candidate.endAnchor);
  if (
    exactQuote === null ||
    exactQuote.trim().length === 0 ||
    prefixText === null ||
    suffixText === null ||
    !startAnchor ||
    !endAnchor
  ) {
    return null;
  }

  const orderComparison = compareAnchorPosition(startAnchor, endAnchor);
  if (orderComparison !== null && orderComparison > 0) {
    return null;
  }

  return {
    fileId,
    source,
    kind,
    commentText,
    exactQuote,
    prefixText,
    suffixText,
    startAnchor,
    endAnchor
  };
}

export function registerAssessmentHandlers(ipcMain: IpcMainLike): void {
  ipcMain.handle(ASSESSMENT_CHANNELS.extractDocument, async (_event, request) => {
    const normalizedRequest = normalizeExtractDocumentRequest(request);
    if (!normalizedRequest) {
      return appErr({
        code: 'ASSESSMENT_EXTRACT_DOCUMENT_INVALID_PAYLOAD',
        message: 'Extract document request must include a non-empty fileId.'
      });
    }
    return notImplementedResult('assessment.extractDocument');
  });

  ipcMain.handle(ASSESSMENT_CHANNELS.listFeedback, async (_event, request) => {
    const normalizedRequest = normalizeListFeedbackRequest(request);
    if (!normalizedRequest) {
      return appErr({
        code: 'ASSESSMENT_LIST_FEEDBACK_INVALID_PAYLOAD',
        message: 'List feedback request must include a non-empty fileId.'
      });
    }
    return notImplementedResult('assessment.listFeedback');
  });

  ipcMain.handle(ASSESSMENT_CHANNELS.addFeedback, async (_event, request) => {
    const normalizedRequest = normalizeAddFeedbackRequest(request);
    if (!normalizedRequest) {
      return appErr({
        code: 'ASSESSMENT_ADD_FEEDBACK_INVALID_PAYLOAD',
        message:
          'Add feedback payload is invalid. Ensure required fields are present, inline anchors are valid, and block comments do not include inline fields.'
      });
    }
    return notImplementedResult('assessment.addFeedback');
  });

  ipcMain.handle(ASSESSMENT_CHANNELS.requestLlmAssessment, async (_event, request) => {
    const normalizedRequest = normalizeRequestLlmAssessmentRequest(request);
    if (!normalizedRequest) {
      return appErr({
        code: 'ASSESSMENT_REQUEST_LLM_ASSESSMENT_INVALID_PAYLOAD',
        message: 'Request LLM assessment must include a non-empty fileId and optional string instruction.'
      });
    }
    return notImplementedResult('assessment.requestLlmAssessment');
  });
}
