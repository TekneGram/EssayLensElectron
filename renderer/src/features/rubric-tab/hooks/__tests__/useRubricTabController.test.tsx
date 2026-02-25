import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRubricTabController } from '../useRubricTabController';

const {
  mockUseAppState,
  mockUseAppDispatch,
  mockUseRubricListQuery,
  mockUseRubricDraftQuery,
  mockUseRubricMutations,
  mockReconcileRubricSelection,
  mockSelectRubric,
  mockCreateRubricAndSelect,
  mockCloneRubricAndSelect,
  mockDeleteRubricAndClearSelection,
  mockSetRubricInteractionMode,
  queueSchedule,
  queueFlush
} = vi.hoisted(() => ({
  mockUseAppState: vi.fn(),
  mockUseAppDispatch: vi.fn(),
  mockUseRubricListQuery: vi.fn(),
  mockUseRubricDraftQuery: vi.fn(),
  mockUseRubricMutations: vi.fn(),
  mockReconcileRubricSelection: vi.fn(),
  mockSelectRubric: vi.fn().mockResolvedValue(undefined),
  mockCreateRubricAndSelect: vi.fn().mockResolvedValue(undefined),
  mockCloneRubricAndSelect: vi.fn().mockResolvedValue(undefined),
  mockDeleteRubricAndClearSelection: vi.fn().mockResolvedValue(undefined),
  mockSetRubricInteractionMode: vi.fn().mockResolvedValue(undefined),
  queueSchedule: vi.fn(),
  queueFlush: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../../../state', () => ({
  useAppState: mockUseAppState,
  useAppDispatch: mockUseAppDispatch
}));

vi.mock('../useRubricListQuery', () => ({
  useRubricListQuery: mockUseRubricListQuery
}));

vi.mock('../useRubricDraftQuery', () => ({
  useRubricDraftQuery: mockUseRubricDraftQuery
}));

vi.mock('../useRubricMutations', () => ({
  useRubricMutations: mockUseRubricMutations
}));

vi.mock('../../application', () => ({
  RubricUpdateQueue: class {
    schedule = queueSchedule;
    flush = queueFlush;
    constructor(_: unknown) {}
  },
  reconcileRubricSelection: mockReconcileRubricSelection,
  selectRubric: mockSelectRubric,
  createRubricAndSelect: mockCreateRubricAndSelect,
  cloneRubricAndSelect: mockCloneRubricAndSelect,
  deleteRubricAndClearSelection: mockDeleteRubricAndClearSelection,
  setRubricInteractionMode: mockSetRubricInteractionMode
}));

describe('useRubricTabController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppState.mockReturnValue({
      rubric: { selectedEditingRubricId: 'r1', interactionMode: 'viewing' }
    });
    mockUseAppDispatch.mockReturnValue(vi.fn());
    mockUseRubricListQuery.mockReturnValue({
      isSuccess: true,
      data: {
        rubrics: [{ entityUuid: 'r1', name: 'Rubric 1', isActive: false, isArchived: false }],
        lastUsedRubricId: 'r1'
      },
      isPending: false,
      isError: false
    });
    mockUseRubricDraftQuery.mockReturnValue({ isPending: false, isError: false, data: { rubricId: 'r1' } });
    mockUseRubricMutations.mockReturnValue({
      updateRubric: vi.fn().mockResolvedValue(undefined),
      setLastUsed: vi.fn().mockResolvedValue(undefined),
      createRubric: vi.fn().mockResolvedValue('new-id'),
      cloneRubric: vi.fn().mockResolvedValue('clone-id'),
      deleteRubric: vi.fn().mockResolvedValue(undefined)
    });
    mockReconcileRubricSelection.mockReturnValue(null);
  });

  it('delegates action handlers to application workflows', async () => {
    const { result } = renderHook(() => useRubricTabController());

    await act(async () => {
      await result.current.selectRubric('r1');
      await result.current.createRubric();
      await result.current.cloneRubric();
      await result.current.deleteRubric();
      await result.current.setInteractionMode('editing');
    });

    expect(mockSelectRubric).toHaveBeenCalledTimes(1);
    expect(mockCreateRubricAndSelect).toHaveBeenCalledTimes(1);
    expect(mockCloneRubricAndSelect).toHaveBeenCalledTimes(1);
    expect(mockDeleteRubricAndClearSelection).toHaveBeenCalledTimes(1);
    expect(mockSetRubricInteractionMode).toHaveBeenCalledTimes(1);
  });

  it('dispatches reconciliation transition when workflow returns one', () => {
    const dispatch = vi.fn();
    mockUseAppDispatch.mockReturnValue(dispatch);
    mockReconcileRubricSelection.mockReturnValue({ rubricId: 'r2', mode: 'viewing' });

    renderHook(() => useRubricTabController());

    expect(dispatch).toHaveBeenCalledWith({ type: 'rubric/selectEditing', payload: 'r2' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'rubric/setInteractionMode', payload: 'viewing' });
  });
});
