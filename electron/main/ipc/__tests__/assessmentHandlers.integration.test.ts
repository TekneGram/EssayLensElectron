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

describe('assessment IPC integration (list/add)', () => {
  it('persists addFeedback through IPC and returns it via listFeedback', async () => {
    const harness = createHarness();
    const repository = new FeedbackRepository({ now: () => '2026-02-19T16:00:00.000Z' });

    registerAssessmentHandlers(
      { handle: harness.handle },
      {
        repository,
        makeFeedbackId: () => 'fb-inline-100'
      }
    );

    const addHandler = harness.getHandler(ASSESSMENT_CHANNELS.addFeedback);
    const listHandler = harness.getHandler(ASSESSMENT_CHANNELS.listFeedback);

    const addResult = await addHandler({}, {
      fileId: 'file-abc',
      source: 'teacher',
      kind: 'inline',
      commentText: 'Tighten this phrase.',
      exactQuote: 'in my opinion',
      prefixText: 'However, ',
      suffixText: ', this weakens the claim.',
      startAnchor: {
        part: 'body',
        paragraphIndex: 0,
        runIndex: 0,
        charOffset: 0
      },
      endAnchor: {
        part: 'body',
        paragraphIndex: 0,
        runIndex: 0,
        charOffset: 13
      }
    });

    expect(addResult).toEqual({
      ok: true,
      data: {
        feedback: {
          id: 'fb-inline-100',
          fileId: 'file-abc',
          source: 'teacher',
          kind: 'inline',
          commentText: 'Tighten this phrase.',
          createdAt: '2026-02-19T16:00:00.000Z',
          updatedAt: undefined,
          applied: false,
          exactQuote: 'in my opinion',
          prefixText: 'However, ',
          suffixText: ', this weakens the claim.',
          startAnchor: {
            part: 'body',
            paragraphIndex: 0,
            runIndex: 0,
            charOffset: 0
          },
          endAnchor: {
            part: 'body',
            paragraphIndex: 0,
            runIndex: 0,
            charOffset: 13
          }
        }
      }
    });

    const listResult = await listHandler({}, { fileId: 'file-abc' });
    expect(listResult).toEqual({
      ok: true,
      data: {
        feedback: [
          {
            id: 'fb-inline-100',
            fileId: 'file-abc',
            source: 'teacher',
            kind: 'inline',
            commentText: 'Tighten this phrase.',
            createdAt: '2026-02-19T16:00:00.000Z',
            updatedAt: undefined,
            applied: false,
            exactQuote: 'in my opinion',
            prefixText: 'However, ',
            suffixText: ', this weakens the claim.',
            startAnchor: {
              part: 'body',
              paragraphIndex: 0,
              runIndex: 0,
              charOffset: 0
            },
            endAnchor: {
              part: 'body',
              paragraphIndex: 0,
              runIndex: 0,
              charOffset: 13
            }
          }
        ]
      }
    });
  });

  it('rejects malformed add payload before repository execution', async () => {
    const harness = createHarness();

    const repository = {
      listByFileId: vi.fn(),
      add: vi.fn()
    } as unknown as FeedbackRepository;

    registerAssessmentHandlers(
      { handle: harness.handle },
      {
        repository,
        makeFeedbackId: () => 'unused'
      }
    );

    const addHandler = harness.getHandler(ASSESSMENT_CHANNELS.addFeedback);
    const result = await addHandler({}, {
      fileId: 'file-abc',
      source: 'teacher',
      kind: 'inline',
      commentText: 'Missing quote and anchors.'
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'ASSESSMENT_ADD_FEEDBACK_INVALID_PAYLOAD',
        message:
          'Add feedback payload is invalid. Ensure required fields are present, inline anchors are valid, and block comments do not include inline fields.'
      }
    });
    expect((repository as unknown as { add: ReturnType<typeof vi.fn> }).add).not.toHaveBeenCalled();
  });
});
