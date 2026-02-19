import { describe, expect, it } from 'vitest';
import { FeedbackRepository, type FeedbackRecord } from '../feedbackRepository';

function makeInlineFeedback(id: string, fileId = 'file-1'): FeedbackRecord {
  return {
    id,
    fileId,
    kind: 'inline',
    source: 'teacher',
    commentText: 'Use a more precise word choice.',
    exactQuote: 'very good',
    prefixText: 'It was ',
    suffixText: ' in the paragraph.',
    startAnchor: {
      part: 'body',
      paragraphIndex: 1,
      runIndex: 0,
      charOffset: 7
    },
    endAnchor: {
      part: 'body',
      paragraphIndex: 1,
      runIndex: 0,
      charOffset: 16
    }
  };
}

describe('FeedbackRepository', () => {
  it('adds and lists block + inline feedback mapped by file id', async () => {
    const repository = new FeedbackRepository({ now: () => '2026-02-19T12:00:00.000Z' });
    await repository.add({
      id: 'block-1',
      fileId: 'file-1',
      kind: 'block',
      source: 'llm',
      commentText: 'Clear thesis. Add one counterargument.'
    });
    await repository.add(makeInlineFeedback('inline-1'));

    const file1Feedback = await repository.listByFileId('file-1');
    expect(file1Feedback).toHaveLength(2);
    expect(file1Feedback[0]).toMatchObject({
      id: 'block-1',
      fileId: 'file-1',
      kind: 'block',
      source: 'llm',
      commentText: 'Clear thesis. Add one counterargument.',
      applied: false,
      createdAt: '2026-02-19T12:00:00.000Z'
    });
    expect(file1Feedback[1]).toMatchObject({
      id: 'inline-1',
      fileId: 'file-1',
      kind: 'inline',
      source: 'teacher',
      exactQuote: 'very good',
      prefixText: 'It was ',
      suffixText: ' in the paragraph.',
      startAnchor: {
        part: 'body',
        paragraphIndex: 1,
        runIndex: 0,
        charOffset: 7
      },
      endAnchor: {
        part: 'body',
        paragraphIndex: 1,
        runIndex: 0,
        charOffset: 16
      }
    });
  });

  it('rolls back add when inline anchors are incomplete', async () => {
    const repository = new FeedbackRepository();
    await repository.add({
      id: 'baseline-block',
      fileId: 'file-1',
      kind: 'block',
      source: 'teacher',
      commentText: 'Baseline comment.'
    });

    await expect(
      repository.add({
        ...makeInlineFeedback('bad-inline'),
        endAnchor: undefined
      })
    ).rejects.toThrow('Inline feedback requires both startAnchor and endAnchor.');

    const file1Feedback = await repository.listByFileId('file-1');
    expect(file1Feedback.map((item) => item.id)).toEqual(['baseline-block']);
  });

  it('rejects block feedback with inline-only fields', async () => {
    const repository = new FeedbackRepository();
    await expect(
      repository.add({
        id: 'bad-block',
        fileId: 'file-1',
        kind: 'block',
        source: 'teacher',
        commentText: 'Overall structure is okay.',
        exactQuote: 'quote should not exist'
      })
    ).rejects.toThrow('Block feedback cannot include inline quote or anchor fields.');
  });

  it('rolls back add when anchor coordinates are invalid', async () => {
    const repository = new FeedbackRepository();
    await expect(
      repository.add({
        ...makeInlineFeedback('bad-anchor'),
        startAnchor: {
          part: 'body',
          paragraphIndex: -1,
          runIndex: 0,
          charOffset: 1
        }
      })
    ).rejects.toThrow('Anchor index fields must be non-negative (start).');

    const file1Feedback = await repository.listByFileId('file-1');
    expect(file1Feedback).toEqual([]);
  });
});
