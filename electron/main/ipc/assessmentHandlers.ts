import { randomUUID } from 'node:crypto';
import { FeedbackRepository, type FeedbackRecord } from '../db/repositories/feedbackRepository';
import { appErr, appOk } from '../../shared/appResult';
import type {
  AddFeedbackRequest,
  AddFeedbackResponse,
  ExtractDocumentRequest,
  FeedbackAnchorDto,
  FeedbackDto,
  ListFeedbackResponse,
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

interface AssessmentHandlerDeps {
  repository: FeedbackRepository;
  makeFeedbackId: () => string;
}

function getDefaultDeps(): AssessmentHandlerDeps {
  return {
    repository: new FeedbackRepository(),
    makeFeedbackId: () => randomUUID()
  };
}

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

function toFeedbackDto(record: FeedbackRecord): FeedbackDto {
  if (record.kind === 'block') {
    return {
      id: record.id,
      fileId: record.fileId,
      kind: 'block',
      source: record.source,
      commentText: record.commentText,
      createdAt: record.createdAt ?? new Date().toISOString(),
      updatedAt: record.updatedAt,
      applied: record.applied
    };
  }

  if (!record.startAnchor || !record.endAnchor || !record.exactQuote) {
    throw new Error(`Inline feedback ${record.id} is missing required inline fields.`);
  }

  return {
    id: record.id,
    fileId: record.fileId,
    kind: 'inline',
    source: record.source,
    commentText: record.commentText,
    createdAt: record.createdAt ?? new Date().toISOString(),
    updatedAt: record.updatedAt,
    applied: record.applied,
    exactQuote: record.exactQuote,
    prefixText: record.prefixText ?? '',
    suffixText: record.suffixText ?? '',
    startAnchor: record.startAnchor,
    endAnchor: record.endAnchor
  };
}

export function registerAssessmentHandlers(ipcMain: IpcMainLike, deps: AssessmentHandlerDeps = getDefaultDeps()): void {
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

    try {
      const records = await deps.repository.listByFileId(normalizedRequest.fileId);
      const feedback = records.map(toFeedbackDto);
      return appOk<ListFeedbackResponse>({ feedback });
    } catch (error) {
      return appErr({
        code: 'ASSESSMENT_LIST_FEEDBACK_FAILED',
        message: 'Could not load feedback for this file.',
        details: error
      });
    }
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

    try {
      const created = await deps.repository.add({
        id: deps.makeFeedbackId(),
        fileId: normalizedRequest.fileId,
        kind: normalizedRequest.kind,
        source: normalizedRequest.source,
        commentText: normalizedRequest.commentText,
        exactQuote: normalizedRequest.kind === 'inline' ? normalizedRequest.exactQuote : undefined,
        prefixText: normalizedRequest.kind === 'inline' ? normalizedRequest.prefixText : undefined,
        suffixText: normalizedRequest.kind === 'inline' ? normalizedRequest.suffixText : undefined,
        startAnchor: normalizedRequest.kind === 'inline' ? normalizedRequest.startAnchor : undefined,
        endAnchor: normalizedRequest.kind === 'inline' ? normalizedRequest.endAnchor : undefined
      });
      return appOk<AddFeedbackResponse>({
        feedback: toFeedbackDto(created)
      });
    } catch (error) {
      return appErr({
        code: 'ASSESSMENT_ADD_FEEDBACK_FAILED',
        message: 'Could not persist feedback.',
        details: error
      });
    }
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
