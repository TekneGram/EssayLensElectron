import { describe, expect, it } from 'vitest';
import { initialRubricState } from '../initialState';
import { rubricReducer } from '../reducers';

describe('rubricReducer', () => {
  it('selects a rubric id', () => {
    const next = rubricReducer(initialRubricState, {
      type: 'rubric/select',
      payload: 'rubric-1'
    });

    expect(next.selectedRubricId).toBe('rubric-1');
    expect(initialRubricState.selectedRubricId).toBeNull();
  });

  it('sets active matrix', () => {
    const next = rubricReducer(initialRubricState, {
      type: 'rubric/setMatrix',
      payload: {
        rubricId: 'rubric-1',
        rubricName: '6 Traits',
        categories: [{ id: 'cat-1', name: 'Ideas' }],
        scores: [{ id: 'score-4', value: 4 }],
        cells: [{ categoryId: 'cat-1', scoreId: 'score-4', description: 'Strong ideas' }]
      }
    });

    expect(next.activeMatrix?.rubricId).toBe('rubric-1');
    expect(initialRubricState.activeMatrix).toBeNull();
  });
});
