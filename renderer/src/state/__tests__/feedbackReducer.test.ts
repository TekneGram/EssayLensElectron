import { describe, expect, it } from 'vitest';
import { initialFeedbackState } from '../initialState';
import { feedbackReducer } from '../reducers';

describe('feedbackReducer', () => {
  it('sets feedback list for a file', () => {
    const next = feedbackReducer(initialFeedbackState, {
      type: 'feedback/setForFile',
      payload: {
        fileId: 'f1',
        items: [
          {
            id: 'c1',
            fileId: 'f1',
            source: 'teacher',
            kind: 'inline',
            commentText: 'Clarify this sentence',
            exactQuote: 'quoted text',
            prefixText: 'prefix',
            suffixText: 'suffix',
            startAnchor: {
              part: 'word/document.xml',
              paragraphIndex: 1,
              runIndex: 1,
              charOffset: 10
            },
            endAnchor: {
              part: 'word/document.xml',
              paragraphIndex: 1,
              runIndex: 2,
              charOffset: 25
            },
            createdAt: '2026-02-18T00:00:00.000Z'
          }
        ]
      }
    });

    expect(next.byFileId.f1).toHaveLength(1);
    expect(initialFeedbackState.byFileId.f1).toBeUndefined();
  });

  it('adds feedback without mutating existing file feedback array', () => {
    const state = {
      ...initialFeedbackState,
      byFileId: {
        f1: [
          {
            id: 'c1',
            fileId: 'f1',
            source: 'teacher' as const,
            kind: 'inline' as const,
            commentText: 'First',
            exactQuote: 'first quote',
            prefixText: 'first prefix',
            suffixText: 'first suffix',
            startAnchor: {
              part: 'word/document.xml',
              paragraphIndex: 1,
              runIndex: 0,
              charOffset: 0
            },
            endAnchor: {
              part: 'word/document.xml',
              paragraphIndex: 1,
              runIndex: 1,
              charOffset: 5
            },
            createdAt: '2026-02-18T00:00:00.000Z'
          }
        ]
      }
    };

    const next = feedbackReducer(state, {
      type: 'feedback/add',
      payload: {
        id: 'c2',
        fileId: 'f1',
        source: 'llm',
        kind: 'block',
        commentText: 'Second',
        createdAt: '2026-02-18T00:00:01.000Z'
      }
    });

    expect(next.byFileId.f1).toHaveLength(2);
    expect(state.byFileId.f1).toHaveLength(1);
  });
});
