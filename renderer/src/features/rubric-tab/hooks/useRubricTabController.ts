import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppState } from '../../../state';
import {
  RubricUpdateQueue,
  cloneRubricAndSelect,
  createRubricAndSelect,
  deleteRubricAndClearSelection,
  reconcileRubricSelection,
  selectRubric,
  setRubricInteractionMode
} from '../application';
import type { RubricCommand } from '../domain';
import { computeCanEditSelectedRubric } from '../domain';
import { useRubricDraftQuery } from './useRubricDraftQuery';
import { useRubricListQuery } from './useRubricListQuery';
import { useRubricMutations } from './useRubricMutations';

export function useRubricTabController() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const selectedRubricId = state.rubric.selectedEditingRubricId;
  const interactionMode = state.rubric.interactionMode;

  const listQuery = useRubricListQuery();
  const draftQuery = useRubricDraftQuery(selectedRubricId);
  const { updateRubric, setLastUsed, createRubric, cloneRubric, deleteRubric } = useRubricMutations(selectedRubricId);
  const updateRubricRef = useRef(updateRubric);
  const updateQueueRef = useRef<RubricUpdateQueue | null>(null);

  if (!updateQueueRef.current) {
    updateQueueRef.current = new RubricUpdateQueue((operation) => updateRubricRef.current(operation));
  }

  useEffect(() => {
    updateRubricRef.current = updateRubric;
  }, [updateRubric]);

  const flushPendingUpdates = async () => {
    if (!updateQueueRef.current) {
      return;
    }
    await updateQueueRef.current.flush();
  };

  const scheduleUpdate = (operationKey: string, operation: RubricCommand) => {
    updateQueueRef.current?.schedule(operationKey, operation);
  };

  useEffect(() => {
    return () => {
      void flushPendingUpdates();
    };
  }, []);

  useEffect(() => {
    if (!listQuery.isSuccess) {
      return;
    }
    const reconciliation = reconcileRubricSelection({
      rubrics: listQuery.data.rubrics,
      selectedRubricId,
      lastUsedRubricId: listQuery.data.lastUsedRubricId
    });
    if (!reconciliation) {
      return;
    }
    dispatch({ type: 'rubric/selectEditing', payload: reconciliation.rubricId });
    dispatch({ type: 'rubric/setInteractionMode', payload: reconciliation.mode });
  }, [dispatch, listQuery.data, listQuery.isSuccess, selectedRubricId]);

  const selectedRubric = listQuery.data?.rubrics.find((rubric) => rubric.entityUuid === selectedRubricId);
  const canEditSelectedRubric = computeCanEditSelectedRubric(selectedRubric);

  return {
    selectedRubricId,
    interactionMode,
    listQuery,
    draftQuery,
    selectedRubric,
    canEditSelectedRubric,
    selectRubric: (rubricId: string) => selectRubric({ dispatch, flushPendingUpdates, setLastUsed }, rubricId),
    createRubric: () => createRubricAndSelect({ dispatch, flushPendingUpdates, createRubric }, 'New Rubric'),
    cloneRubric: () => {
      if (!selectedRubricId) {
        return Promise.resolve();
      }
      return cloneRubricAndSelect({ dispatch, flushPendingUpdates, cloneRubric, setLastUsed }, selectedRubricId);
    },
    deleteRubric: () => {
      if (!selectedRubricId) {
        return Promise.resolve();
      }
      return deleteRubricAndClearSelection({ dispatch, flushPendingUpdates, deleteRubric }, selectedRubricId);
    },
    setInteractionMode: (mode: 'editing' | 'viewing') => setRubricInteractionMode(dispatch, flushPendingUpdates, mode),
    scheduleUpdate,
    updateRubric
  };
}
