import { randomUUID } from 'node:crypto';
import { FeedbackRepository, type FeedbackRecord } from '../db/repositories/feedbackRepository';
import { appErr, appOk } from '../../shared/appResult';
import type {
  ApplyFeedbackRequest,
  ApplyFeedbackResponse,
  AddFeedbackRequest,
  AddFeedbackResponse,
  DeleteFeedbackRequest,
  DeleteFeedbackResponse,
  EditFeedbackRequest,
  EditFeedbackResponse,
  ExtractDocumentRequest,
  ExtractDocumentResponse,
  FeedbackAnchorDto,
  FeedbackDto,
  GenerateFeedbackDocumentRequest,
  GenerateFeedbackDocumentResponse,
  ListFeedbackResponse,
  ListFeedbackRequest,
  RequestLlmAssessmentRequest,
  SendFeedbackToLlmRequest,
  SendFeedbackToLlmResponse
} from '../../shared/assessmentContracts';
import { extractDocumentText, type ExtractedDocument } from '../services/documentExtractor';
import { generateFeedbackFile } from '../services/feedbackFileGenerator';
import { WorkspaceRepository } from '../db/repositories/workspaceRepository';
import { notImplementedResult } from './result';
import type { IpcMainLike } from './types';

export const ASSESSMENT_CHANNELS = {
  extractDocument: 'assessment/extractDocument',
  listFeedback: 'assessment/listFeedback',
  addFeedback: 'assessment/addFeedback',
  editFeedback: 'assessment/editFeedback',
  deleteFeedback: 'assessment/deleteFeedback',
  applyFeedback: 'assessment/applyFeedback',
  sendFeedbackToLlm: 'assessment/sendFeedbackToLlm',
  generateFeedbackDocument: 'assessment/generateFeedbackDocument',
  requestLlmAssessment: 'assessment/requestLlmAssessment'
} as const;

interface AssessmentHandlerDeps {
  repository: FeedbackRepository;
  workspaceRepository: WorkspaceRepository;
  makeFeedbackId: () => string;
  makeMessageId?: () => string;
  extractDocument: (filePath: string) => Promise<ExtractedDocument>;
  generateFeedbackFile: typeof generateFeedbackFile;
}

function getDefaultDeps(): AssessmentHandlerDeps {
  return {
    repository: new FeedbackRepository(),
    workspaceRepository: new WorkspaceRepository(),
    makeFeedbackId: () => randomUUID(),
    makeMessageId: () => randomUUID(),
    extractDocument: extractDocumentText,
    generateFeedbackFile
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

function normalizeGenerateFeedbackDocumentRequest(request: unknown): GenerateFeedbackDocumentRequest | null {
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

function normalizeEditFeedbackRequest(request: unknown): EditFeedbackRequest | null {
  if (typeof request !== 'object' || request === null) {
    return null;
  }

  const candidate = request as Record<string, unknown>;
  const feedbackId = normalizeNonEmptyString(candidate.feedbackId);
  const commentText = normalizeNonEmptyString(candidate.commentText);
  if (!feedbackId || !commentText) {
    return null;
  }

  return {
    feedbackId,
    commentText
  };
}

function normalizeDeleteFeedbackRequest(request: unknown): DeleteFeedbackRequest | null {
  if (typeof request !== 'object' || request === null) {
    return null;
  }

  const candidate = request as Record<string, unknown>;
  const feedbackId = normalizeNonEmptyString(candidate.feedbackId);
  if (!feedbackId) {
    return null;
  }

  return { feedbackId };
}

function normalizeApplyFeedbackRequest(request: unknown): ApplyFeedbackRequest | null {
  if (typeof request !== 'object' || request === null) {
    return null;
  }

  const candidate = request as Record<string, unknown>;
  const feedbackId = normalizeNonEmptyString(candidate.feedbackId);
  if (!feedbackId || typeof candidate.applied !== 'boolean') {
    return null;
  }

  return {
    feedbackId,
    applied: candidate.applied
  };
}

function normalizeSendFeedbackToLlmRequest(request: unknown): SendFeedbackToLlmRequest | null {
  if (typeof request !== 'object' || request === null) {
    return null;
  }

  const candidate = request as Record<string, unknown>;
  const feedbackId = normalizeNonEmptyString(candidate.feedbackId);
  if (!feedbackId) {
    return null;
  }

  if (!hasOwnProperty(candidate, 'command')) {
    return { feedbackId };
  }

  if (candidate.command === undefined) {
    return { feedbackId };
  }

  const command = normalizeNonEmptyString(candidate.command);
  if (!command) {
    return null;
  }

  return {
    feedbackId,
    command
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

export function registerAssessmentHandlers(
  ipcMain: IpcMainLike,
  deps: Partial<AssessmentHandlerDeps> = {}
): void {
  const resolvedDeps = {
    ...getDefaultDeps(),
    ...deps
  };

  ipcMain.handle(ASSESSMENT_CHANNELS.extractDocument, async (_event, request) => {
    const normalizedRequest = normalizeExtractDocumentRequest(request);
    if (!normalizedRequest) {
      return appErr({
        code: 'ASSESSMENT_EXTRACT_DOCUMENT_INVALID_PAYLOAD',
        message: 'Extract document request must include a non-empty fileId.'
      });
    }

    try {
      const sourceFile = await resolvedDeps.workspaceRepository.resolveFileById(normalizedRequest.fileId);
      if (!sourceFile) {
        return appErr({
          code: 'ASSESSMENT_EXTRACT_DOCUMENT_NOT_FOUND',
          message: 'Could not find the selected file.'
        });
      }
      const extracted = await resolvedDeps.extractDocument(sourceFile.path);
      return appOk<ExtractDocumentResponse>({
        fileId: normalizedRequest.fileId,
        text: extracted.text,
        extractedAt: extracted.extractedAt,
        format: extracted.format,
        fileName: sourceFile.name,
        dataBase64: extracted.dataBase64
      });
    } catch (error) {
      return appErr({
        code: 'ASSESSMENT_EXTRACT_DOCUMENT_FAILED',
        message: 'Could not extract document.',
        details: error
      });
    }
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
      const records = await resolvedDeps.repository.listByFileId(normalizedRequest.fileId);
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
      const created = await resolvedDeps.repository.add({
        id: resolvedDeps.makeFeedbackId(),
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

  ipcMain.handle(ASSESSMENT_CHANNELS.editFeedback, async (_event, request) => {
    const normalizedRequest = normalizeEditFeedbackRequest(request);
    if (!normalizedRequest) {
      return appErr({
        code: 'ASSESSMENT_EDIT_FEEDBACK_INVALID_PAYLOAD',
        message: 'Edit feedback request must include non-empty feedbackId and commentText.'
      });
    }

    try {
      const edited = await resolvedDeps.repository.editCommentText(
        normalizedRequest.feedbackId,
        normalizedRequest.commentText
      );
      if (!edited) {
        return appErr({
          code: 'ASSESSMENT_EDIT_FEEDBACK_NOT_FOUND',
          message: 'Feedback item not found.'
        });
      }
      return appOk<EditFeedbackResponse>({
        feedback: toFeedbackDto(edited)
      });
    } catch (error) {
      return appErr({
        code: 'ASSESSMENT_EDIT_FEEDBACK_FAILED',
        message: 'Could not edit feedback.',
        details: error
      });
    }
  });

  ipcMain.handle(ASSESSMENT_CHANNELS.deleteFeedback, async (_event, request) => {
    const normalizedRequest = normalizeDeleteFeedbackRequest(request);
    if (!normalizedRequest) {
      return appErr({
        code: 'ASSESSMENT_DELETE_FEEDBACK_INVALID_PAYLOAD',
        message: 'Delete feedback request must include a non-empty feedbackId.'
      });
    }

    try {
      const deleted = await resolvedDeps.repository.deleteById(normalizedRequest.feedbackId);
      if (!deleted) {
        return appErr({
          code: 'ASSESSMENT_DELETE_FEEDBACK_NOT_FOUND',
          message: 'Feedback item not found.'
        });
      }
      return appOk<DeleteFeedbackResponse>({
        deletedFeedbackId: normalizedRequest.feedbackId
      });
    } catch (error) {
      return appErr({
        code: 'ASSESSMENT_DELETE_FEEDBACK_FAILED',
        message: 'Could not delete feedback.',
        details: error
      });
    }
  });

  ipcMain.handle(ASSESSMENT_CHANNELS.applyFeedback, async (_event, request) => {
    const normalizedRequest = normalizeApplyFeedbackRequest(request);
    if (!normalizedRequest) {
      return appErr({
        code: 'ASSESSMENT_APPLY_FEEDBACK_INVALID_PAYLOAD',
        message: 'Apply feedback request must include a non-empty feedbackId and boolean applied.'
      });
    }

    try {
      const updated = await resolvedDeps.repository.setApplied(
        normalizedRequest.feedbackId,
        normalizedRequest.applied
      );
      if (!updated) {
        return appErr({
          code: 'ASSESSMENT_APPLY_FEEDBACK_NOT_FOUND',
          message: 'Feedback item not found.'
        });
      }
      return appOk<ApplyFeedbackResponse>({
        feedback: toFeedbackDto(updated)
      });
    } catch (error) {
      return appErr({
        code: 'ASSESSMENT_APPLY_FEEDBACK_FAILED',
        message: 'Could not apply feedback.',
        details: error
      });
    }
  });

  ipcMain.handle(ASSESSMENT_CHANNELS.sendFeedbackToLlm, async (_event, request) => {
    const normalizedRequest = normalizeSendFeedbackToLlmRequest(request);
    if (!normalizedRequest) {
      return appErr({
        code: 'ASSESSMENT_SEND_FEEDBACK_TO_LLM_INVALID_PAYLOAD',
        message: 'Send feedback to LLM request must include a non-empty feedbackId and optional command.'
      });
    }

    try {
      const source = await resolvedDeps.repository.getById(normalizedRequest.feedbackId);
      if (!source) {
        return appErr({
          code: 'ASSESSMENT_SEND_FEEDBACK_TO_LLM_NOT_FOUND',
          message: 'Feedback item not found.'
        });
      }

      const commandLabel = normalizedRequest.command ? ` [${normalizedRequest.command}]` : '';
      const generatedCommentText = `LLM follow-up${commandLabel}: ${source.commentText}`;
      await resolvedDeps.repository.add({
        id: resolvedDeps.makeFeedbackId(),
        fileId: source.fileId,
        kind: source.kind,
        source: 'llm',
        commentText: generatedCommentText,
        exactQuote: source.kind === 'inline' ? source.exactQuote : undefined,
        prefixText: source.kind === 'inline' ? source.prefixText : undefined,
        suffixText: source.kind === 'inline' ? source.suffixText : undefined,
        startAnchor: source.kind === 'inline' ? source.startAnchor : undefined,
        endAnchor: source.kind === 'inline' ? source.endAnchor : undefined
      });

      return appOk<SendFeedbackToLlmResponse>({
        status: 'sent',
        messageId: resolvedDeps.makeMessageId?.() ?? resolvedDeps.makeFeedbackId()
      });
    } catch (error) {
      return appErr({
        code: 'ASSESSMENT_SEND_FEEDBACK_TO_LLM_FAILED',
        message: 'Could not send feedback to LLM.',
        details: error
      });
    }
  });

  ipcMain.handle(ASSESSMENT_CHANNELS.generateFeedbackDocument, async (_event, request) => {
    const normalizedRequest = normalizeGenerateFeedbackDocumentRequest(request);
    if (!normalizedRequest) {
      return appErr({
        code: 'ASSESSMENT_GENERATE_FEEDBACK_DOCUMENT_INVALID_PAYLOAD',
        message: 'Generate feedback document request must include a non-empty fileId.'
      });
    }

    try {
      const feedback = await resolvedDeps.repository.listByFileId(normalizedRequest.fileId);
      const sourceFile = await resolvedDeps.workspaceRepository.resolveFileById(normalizedRequest.fileId);
      if (!sourceFile) {
        return appErr({
          code: 'ASSESSMENT_GENERATE_FEEDBACK_DOCUMENT_NOT_FOUND',
          message: 'Could not find the selected file.'
        });
      }
      const inlineFeedback = feedback.filter((item) => item.kind === 'inline');
      const outputPath = sourceFile.path.replace(/\.docx$/i, '.annotated.docx');
      const result = await resolvedDeps.generateFeedbackFile({
        sourceFilePath: sourceFile.path,
        outputPath,
        comments: inlineFeedback.map((item) => ({
          commentText: item.commentText,
          exactQuote: item.exactQuote ?? '',
          startAnchor: item.startAnchor ?? {
            part: 'word/document.xml',
            paragraphIndex: 0,
            runIndex: 0,
            charOffset: 0
          },
          endAnchor: item.endAnchor ?? {
            part: 'word/document.xml',
            paragraphIndex: 0,
            runIndex: 0,
            charOffset: 0
          }
        }))
      });

      return appOk<GenerateFeedbackDocumentResponse>({
        fileId: normalizedRequest.fileId,
        outputPath: result.outputPath
      });
    } catch (error) {
      return appErr({
        code: 'ASSESSMENT_GENERATE_FEEDBACK_DOCUMENT_FAILED',
        message: 'Could not generate feedback document.',
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
