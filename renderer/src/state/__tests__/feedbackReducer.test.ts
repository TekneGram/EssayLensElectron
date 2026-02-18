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
            content: 'Clarify this sentence',
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
            content: 'First',
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
        content: 'Second',
        createdAt: '2026-02-18T00:00:01.000Z'
      }
    });

    expect(next.byFileId.f1).toHaveLength(2);
    expect(state.byFileId.f1).toHaveLength(1);
  });
});
