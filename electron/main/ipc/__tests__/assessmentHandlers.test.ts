import { describe, expect, it, vi } from 'vitest';
import { FeedbackRepository } from '../../db/repositories/feedbackRepository';
import { ASSESSMENT_CHANNELS, registerAssessmentHandlers } from '../assessmentHandlers';

function createHarness() {
  const handle = vi.fn();

  return {
    handle,
    getHandler: (channel: string) => {
      const handler = handle.mock.calls.find(([registeredChannel]) => registeredChannel === channel)?.[1];
      expect(handler).toBeTypeOf('function');
      return handler as (event: unknown, payload?: unknown) => Promise<unknown>;
    }
  };
}

function makeAnchor(
  overrides: Partial<{
    part: string;
    paragraphIndex: number;
    runIndex: number;
    charOffset: number;
  }> = {}
) {
  return {
    part: 'body',
    paragraphIndex: 1,
    runIndex: 2,
    charOffset: 3,
    ...overrides
  };
}

describe('registerAssessmentHandlers', () => {
  it('rejects malformed listFeedback payloads', async () => {
    const harness = createHarness();
    registerAssessmentHandlers({ handle: harness.handle });

    const listFeedbackHandler = harness.getHandler(ASSESSMENT_CHANNELS.listFeedback);
    const result = await listFeedbackHandler({}, { fileId: '   ' });

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'ASSESSMENT_LIST_FEEDBACK_INVALID_PAYLOAD',
        message: 'List feedback request must include a non-empty fileId.'
      }
    });
  });

  it('returns listFeedback from repository in the shared DTO envelope', async () => {
    const harness = createHarness();
    const repository = new FeedbackRepository({ now: () => '2026-02-19T12:00:00.000Z' });
    await repository.add({
      id: 'fb-inline-1',
      fileId: 'file-1',
      kind: 'inline',
      source: 'teacher',
      commentText: 'Tighten this phrase.',
      exactQuote: 'in my opinion',
      prefixText: 'However, ',
      suffixText: ', this point is weak.',
      startAnchor: makeAnchor({ paragraphIndex: 0, runIndex: 0, charOffset: 0 }),
      endAnchor: makeAnchor({ paragraphIndex: 0, runIndex: 0, charOffset: 13 })
    });
    registerAssessmentHandlers({ handle: harness.handle }, { repository, makeFeedbackId: () => 'unused' });

    const listFeedbackHandler = harness.getHandler(ASSESSMENT_CHANNELS.listFeedback);
    const result = await listFeedbackHandler({}, { fileId: 'file-1' });

    expect(result).toEqual({
      ok: true,
      data: {
        feedback: [
          {
            id: 'fb-inline-1',
            fileId: 'file-1',
            kind: 'inline',
            source: 'teacher',
            commentText: 'Tighten this phrase.',
            createdAt: '2026-02-19T12:00:00.000Z',
            updatedAt: undefined,
            applied: false,
            exactQuote: 'in my opinion',
            prefixText: 'However, ',
            suffixText: ', this point is weak.',
            startAnchor: makeAnchor({ paragraphIndex: 0, runIndex: 0, charOffset: 0 }),
            endAnchor: makeAnchor({ paragraphIndex: 0, runIndex: 0, charOffset: 13 })
          }
        ]
      }
    });
  });

  it('returns normalized failure when repository listFeedback fails', async () => {
    const harness = createHarness();
    registerAssessmentHandlers(
      { handle: harness.handle },
      {
        repository: {
          listByFileId: vi.fn().mockRejectedValue(new Error('list failed')),
          add: vi.fn()
        } as unknown as FeedbackRepository,
        makeFeedbackId: () => 'unused'
      }
    );

    const listFeedbackHandler = harness.getHandler(ASSESSMENT_CHANNELS.listFeedback);
    const result = await listFeedbackHandler({}, { fileId: 'file-1' });

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'ASSESSMENT_LIST_FEEDBACK_FAILED',
        message: 'Could not load feedback for this file.'
      }
    });
  });

  it('rejects inline addFeedback payloads with missing required quote/anchor fields', async () => {
    const harness = createHarness();
    registerAssessmentHandlers({ handle: harness.handle });

    const addFeedbackHandler = harness.getHandler(ASSESSMENT_CHANNELS.addFeedback);
    const result = await addFeedbackHandler({}, {
      fileId: 'file-1',
      source: 'teacher',
      kind: 'inline',
      commentText: 'Needs stronger support.'
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'ASSESSMENT_ADD_FEEDBACK_INVALID_PAYLOAD',
        message:
          'Add feedback payload is invalid. Ensure required fields are present, inline anchors are valid, and block comments do not include inline fields.'
      }
    });
  });

  it('rejects block addFeedback payloads containing inline-only fields', async () => {
    const harness = createHarness();
    registerAssessmentHandlers({ handle: harness.handle });

    const addFeedbackHandler = harness.getHandler(ASSESSMENT_CHANNELS.addFeedback);
    const result = await addFeedbackHandler({}, {
      fileId: 'file-1',
      source: 'teacher',
      kind: 'block',
      commentText: 'Overall structure is clear.',
      exactQuote: 'Quoted text should not be here.'
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'ASSESSMENT_ADD_FEEDBACK_INVALID_PAYLOAD',
        message:
          'Add feedback payload is invalid. Ensure required fields are present, inline anchors are valid, and block comments do not include inline fields.'
      }
    });
  });

  it('rejects inline anchors when fields are non-integer or negative', async () => {
    const harness = createHarness();
    registerAssessmentHandlers({ handle: harness.handle });

    const addFeedbackHandler = harness.getHandler(ASSESSMENT_CHANNELS.addFeedback);
    const result = await addFeedbackHandler({}, {
      fileId: 'file-1',
      source: 'teacher',
      kind: 'inline',
      commentText: 'Check this phrase.',
      exactQuote: 'on the other hand',
      prefixText: 'However, ',
      suffixText: ' this claim...',
      startAnchor: makeAnchor({ paragraphIndex: -1 }),
      endAnchor: makeAnchor({ paragraphIndex: 1.5 })
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'ASSESSMENT_ADD_FEEDBACK_INVALID_PAYLOAD',
        message:
          'Add feedback payload is invalid. Ensure required fields are present, inline anchors are valid, and block comments do not include inline fields.'
      }
    });
  });

  it('rejects inline anchors with start position after end position when in same part', async () => {
    const harness = createHarness();
    registerAssessmentHandlers({ handle: harness.handle });

    const addFeedbackHandler = harness.getHandler(ASSESSMENT_CHANNELS.addFeedback);
    const result = await addFeedbackHandler({}, {
      fileId: 'file-1',
      source: 'teacher',
      kind: 'inline',
      commentText: 'This phrase is awkward.',
      exactQuote: 'it are',
      prefixText: 'Because ',
      suffixText: ' very difficult',
      startAnchor: makeAnchor({ paragraphIndex: 3, runIndex: 0, charOffset: 10 }),
      endAnchor: makeAnchor({ paragraphIndex: 3, runIndex: 0, charOffset: 4 })
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'ASSESSMENT_ADD_FEEDBACK_INVALID_PAYLOAD',
        message:
          'Add feedback payload is invalid. Ensure required fields are present, inline anchors are valid, and block comments do not include inline fields.'
      }
    });
  });

  it('adds feedback through repository and returns AddFeedbackResponse', async () => {
    const harness = createHarness();
    const repository = new FeedbackRepository({ now: () => '2026-02-19T12:34:56.000Z' });
    registerAssessmentHandlers({ handle: harness.handle }, {
      repository,
      makeFeedbackId: () => 'fb-new-1',
      extractDocument: vi.fn().mockResolvedValue({
        text: '',
        extractedAt: '2026-02-19T12:34:56.000Z',
        format: 'docx',
        dataBase64: 'ZmFrZQ=='
      })
    });

    const addFeedbackHandler = harness.getHandler(ASSESSMENT_CHANNELS.addFeedback);
    const extractDocumentHandler = harness.getHandler(ASSESSMENT_CHANNELS.extractDocument);
    const requestLlmAssessmentHandler = harness.getHandler(ASSESSMENT_CHANNELS.requestLlmAssessment);

    const addResult = await addFeedbackHandler({}, {
      fileId: 'file-1',
      source: 'teacher',
      kind: 'inline',
      commentText: 'Good transitional phrase.',
      exactQuote: 'As a result',
      prefixText: '  ',
      suffixText: ', the outcome improved.',
      startAnchor: makeAnchor({ paragraphIndex: 0, runIndex: 0, charOffset: 0 }),
      endAnchor: makeAnchor({ paragraphIndex: 0, runIndex: 0, charOffset: 9 })
    });
    const extractResult = await extractDocumentHandler({}, { fileId: 'file-1' });
    const requestLlmResult = await requestLlmAssessmentHandler({}, { fileId: 'file-1', instruction: '  evaluate cohesion  ' });

    expect(addResult).toEqual({
      ok: true,
      data: {
        feedback: {
          id: 'fb-new-1',
          fileId: 'file-1',
          source: 'teacher',
          kind: 'inline',
          commentText: 'Good transitional phrase.',
          createdAt: '2026-02-19T12:34:56.000Z',
          updatedAt: undefined,
          applied: false,
          exactQuote: 'As a result',
          prefixText: '  ',
          suffixText: ', the outcome improved.',
          startAnchor: makeAnchor({ paragraphIndex: 0, runIndex: 0, charOffset: 0 }),
          endAnchor: makeAnchor({ paragraphIndex: 0, runIndex: 0, charOffset: 9 })
        }
      }
    });
    expect(extractResult).toEqual({
      ok: true,
      data: {
        fileId: 'file-1',
        text: '',
        extractedAt: '2026-02-19T12:34:56.000Z',
        format: 'docx',
        fileName: 'file-1',
        dataBase64: 'ZmFrZQ=='
      }
    });
    expect(requestLlmResult).toEqual({
      ok: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'assessment.requestLlmAssessment is not implemented yet.'
      }
    });
  });

  it('returns normalized failure when repository addFeedback fails', async () => {
    const harness = createHarness();
    registerAssessmentHandlers(
      { handle: harness.handle },
      {
        repository: {
          listByFileId: vi.fn(),
          add: vi.fn().mockRejectedValue(new Error('add failed'))
        } as unknown as FeedbackRepository,
        makeFeedbackId: () => 'fb-new-1'
      }
    );

    const addFeedbackHandler = harness.getHandler(ASSESSMENT_CHANNELS.addFeedback);
    const result = await addFeedbackHandler({}, {
      fileId: 'file-1',
      source: 'teacher',
      kind: 'block',
      commentText: 'Overall structure is clear.'
    });

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'ASSESSMENT_ADD_FEEDBACK_FAILED',
        message: 'Could not persist feedback.'
      }
    });
  });

  it('edits, applies, deletes, and sends feedback to LLM', async () => {
    const harness = createHarness();
    const repository = new FeedbackRepository({ now: () => '2026-02-19T14:00:00.000Z' });
    await repository.add({
      id: 'feedback-1',
      fileId: 'file-1',
      source: 'teacher',
      kind: 'inline',
      commentText: 'Initial comment.',
      exactQuote: 'selected phrase',
      prefixText: 'Before ',
      suffixText: ' after',
      startAnchor: makeAnchor({ paragraphIndex: 0, runIndex: 0, charOffset: 0 }),
      endAnchor: makeAnchor({ paragraphIndex: 0, runIndex: 0, charOffset: 15 })
    });
    registerAssessmentHandlers(
      { handle: harness.handle },
      { repository, makeFeedbackId: () => 'feedback-llm-1', makeMessageId: () => 'msg-1' }
    );

    const editHandler = harness.getHandler(ASSESSMENT_CHANNELS.editFeedback);
    const applyHandler = harness.getHandler(ASSESSMENT_CHANNELS.applyFeedback);
    const sendToLlmHandler = harness.getHandler(ASSESSMENT_CHANNELS.sendFeedbackToLlm);
    const deleteHandler = harness.getHandler(ASSESSMENT_CHANNELS.deleteFeedback);
    const listHandler = harness.getHandler(ASSESSMENT_CHANNELS.listFeedback);

    const editResult = await editHandler({}, { feedbackId: 'feedback-1', commentText: 'Edited comment.' });
    expect(editResult).toMatchObject({
      ok: true,
      data: {
        feedback: {
          id: 'feedback-1',
          commentText: 'Edited comment.'
        }
      }
    });

    const applyResult = await applyHandler({}, { feedbackId: 'feedback-1', applied: true });
    expect(applyResult).toMatchObject({
      ok: true,
      data: {
        feedback: {
          id: 'feedback-1',
          applied: true
        }
      }
    });

    const sendToLlmResult = await sendToLlmHandler({}, { feedbackId: 'feedback-1', command: 'check-hedging' });
    expect(sendToLlmResult).toEqual({
      ok: true,
      data: {
        status: 'sent',
        messageId: 'msg-1'
      }
    });

    const listAfterSend = await listHandler({}, { fileId: 'file-1' });
    expect(listAfterSend).toMatchObject({
      ok: true,
      data: {
        feedback: expect.arrayContaining([
          expect.objectContaining({
            id: 'feedback-llm-1',
            source: 'llm',
            kind: 'inline'
          })
        ])
      }
    });

    const deleteResult = await deleteHandler({}, { feedbackId: 'feedback-1' });
    expect(deleteResult).toEqual({
      ok: true,
      data: {
        deletedFeedbackId: 'feedback-1'
      }
    });
  });
});
