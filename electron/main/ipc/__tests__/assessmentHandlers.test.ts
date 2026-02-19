import { describe, expect, it, vi } from 'vitest';
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

function makeAnchor(overrides: Partial<Record<'part' | 'paragraphIndex' | 'runIndex' | 'charOffset', unknown>> = {}) {
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

  it('passes valid payload validation and returns not implemented (current phase behavior)', async () => {
    const harness = createHarness();
    registerAssessmentHandlers({ handle: harness.handle });

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
      ok: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'assessment.addFeedback is not implemented yet.'
      }
    });
    expect(extractResult).toEqual({
      ok: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'assessment.extractDocument is not implemented yet.'
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
});
