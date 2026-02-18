import { describe, expect, it } from 'vitest';
import { initialUiState } from '../initialState';
import { uiReducer } from '../reducers';

describe('uiReducer', () => {
  it('changes active top tab', () => {
    const next = uiReducer(initialUiState, {
      type: 'ui/setTopTab',
      payload: 'rubric'
    });

    expect(next.activeTopTab).toBe('rubric');
    expect(initialUiState.activeTopTab).toBe('assessment');
  });

  it('changes comments tab and theme', () => {
    const comments = uiReducer(initialUiState, {
      type: 'ui/setCommentsTab',
      payload: 'score'
    });
    const themed = uiReducer(comments, {
      type: 'ui/setTheme',
      payload: 'light'
    });

    expect(comments.activeCommentsTab).toBe('score');
    expect(themed.theme).toBe('light');
  });
});
