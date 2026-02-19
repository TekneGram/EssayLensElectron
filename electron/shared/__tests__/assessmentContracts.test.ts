import { describe, expect, it } from 'vitest';
import type {
  AddFeedbackRequest,
  AddFeedbackResponse,
  ApplyFeedbackRequest,
  ApplyFeedbackResponse,
  BlockFeedbackDto,
  DeleteFeedbackRequest,
  DeleteFeedbackResponse,
  EditFeedbackRequest,
  EditFeedbackResponse,
  FeedbackAnchorDto,
  InlineFeedbackDto,
  ListFeedbackRequest,
  ListFeedbackResponse,
  RequestLlmAssessmentRequest,
  RequestLlmAssessmentResponse,
  SendFeedbackToLlmRequest,
  SendFeedbackToLlmResponse
} from '../assessmentContracts';

describe('assessment contracts', () => {
  it('accepts canonical list/add request and response fixture shapes', () => {
    const anchor = {
      part: 'word/document.xml',
      paragraphIndex: 0,
      runIndex: 1,
      charOffset: 12
    } satisfies FeedbackAnchorDto;

    const inlineFeedback = {
      id: 'fb-inline-1',
      fileId: 'file-1',
      source: 'teacher',
      kind: 'inline',
      commentText: 'Clarify this claim.',
      exactQuote: 'on the other hand',
      prefixText: 'However, ',
      suffixText: ', this point...',
      startAnchor: anchor,
      endAnchor: { ...anchor, charOffset: 29 },
      createdAt: '2026-02-19T12:00:00.000Z'
    } satisfies InlineFeedbackDto;

    const blockFeedback = {
      id: 'fb-block-1',
      fileId: 'file-1',
      source: 'llm',
      kind: 'block',
      commentText: 'Overall organization is clear.',
      createdAt: '2026-02-19T12:00:01.000Z'
    } satisfies BlockFeedbackDto;

    const listRequest = { fileId: 'file-1' } satisfies ListFeedbackRequest;
    const listResponse = { feedback: [inlineFeedback, blockFeedback] } satisfies ListFeedbackResponse;

    const addInlineRequest = {
      fileId: 'file-1',
      source: 'teacher',
      kind: 'inline',
      commentText: inlineFeedback.commentText,
      exactQuote: inlineFeedback.exactQuote,
      prefixText: inlineFeedback.prefixText,
      suffixText: inlineFeedback.suffixText,
      startAnchor: inlineFeedback.startAnchor,
      endAnchor: inlineFeedback.endAnchor
    } satisfies AddFeedbackRequest;

    const addBlockRequest = {
      fileId: 'file-1',
      source: 'teacher',
      kind: 'block',
      commentText: 'Add a stronger conclusion.'
    } satisfies AddFeedbackRequest;

    const addResponse = { feedback: inlineFeedback } satisfies AddFeedbackResponse;

    expect(listRequest.fileId).toBe('file-1');
    expect(listResponse.feedback).toHaveLength(2);
    expect(addInlineRequest.kind).toBe('inline');
    expect(addBlockRequest.kind).toBe('block');
    expect(addResponse.feedback.id).toBe('fb-inline-1');
  });

  it('accepts operational request/response fixtures for edit/delete/apply/send and llm assessment', () => {
    const editRequest = { feedbackId: 'fb-1', commentText: 'Edited text.' } satisfies EditFeedbackRequest;
    const deleteRequest = { feedbackId: 'fb-1' } satisfies DeleteFeedbackRequest;
    const applyRequest = { feedbackId: 'fb-1', applied: true } satisfies ApplyFeedbackRequest;
    const sendRequest = { feedbackId: 'fb-1', command: 'evaluate-thesis' } satisfies SendFeedbackToLlmRequest;
    const llmRequest = { fileId: 'file-1', instruction: 'Evaluate cohesion.' } satisfies RequestLlmAssessmentRequest;

    const blockFeedback = {
      id: 'fb-1',
      fileId: 'file-1',
      source: 'teacher',
      kind: 'block',
      commentText: 'Edited text.',
      createdAt: '2026-02-19T12:00:01.000Z'
    } satisfies BlockFeedbackDto;

    const editResponse = { feedback: blockFeedback } satisfies EditFeedbackResponse;
    const deleteResponse = { deletedFeedbackId: 'fb-1' } satisfies DeleteFeedbackResponse;
    const applyResponse = {
      feedback: { ...blockFeedback, applied: true, updatedAt: '2026-02-19T12:00:02.000Z' }
    } satisfies ApplyFeedbackResponse;
    const sendResponse = { status: 'sent', messageId: 'msg-1' } satisfies SendFeedbackToLlmResponse;
    const llmResponse = { status: 'completed', feedback: [blockFeedback] } satisfies RequestLlmAssessmentResponse;

    expect(editRequest.feedbackId).toBe('fb-1');
    expect(deleteRequest.feedbackId).toBe('fb-1');
    expect(applyRequest.applied).toBe(true);
    expect(sendRequest.command).toBe('evaluate-thesis');
    expect(llmRequest.fileId).toBe('file-1');
    expect(editResponse.feedback.commentText).toBe('Edited text.');
    expect(deleteResponse.deletedFeedbackId).toBe('fb-1');
    expect(applyResponse.feedback.applied).toBe(true);
    expect(sendResponse.status).toBe('sent');
    expect(llmResponse.status).toBe('completed');
  });
});
