import { useCallback, useEffect, useRef } from 'react';
import type { UpdateRubricOperation } from '../../../../../electron/shared/rubricContracts';
import { useAppDispatch, useAppState } from '../../../state';
import { useRubricDraftQuery, useRubricListQuery, useRubricMutations } from '../hooks';
import { RubricForReact } from './RubricForReact';

export function RubricTab() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const selectedRubricId = state.rubric.selectedRubricId;
  const interactionMode = state.rubric.interactionMode;

  const listQuery = useRubricListQuery();
  const draftQuery = useRubricDraftQuery(selectedRubricId);
  const { updateRubric, setLastUsed, createRubric, cloneRubric, deleteRubric } = useRubricMutations(selectedRubricId);
  const pendingOperationsRef = useRef(new Map<string, UpdateRubricOperation>());
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const flushPendingUpdates = useCallback(async () => {
    const operations = Array.from(pendingOperationsRef.current.values());
    pendingOperationsRef.current.clear();
    for (const timer of timersRef.current.values()) {
      clearTimeout(timer);
    }
    timersRef.current.clear();
    for (const operation of operations) {
      await updateRubric(operation);
    }
  }, [updateRubric]);

  const scheduleUpdate = useCallback(
    (operationKey: string, operation: UpdateRubricOperation) => {
      pendingOperationsRef.current.set(operationKey, operation);
      const existingTimer = timersRef.current.get(operationKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      const timer = setTimeout(() => {
        const pendingOperation = pendingOperationsRef.current.get(operationKey);
        pendingOperationsRef.current.delete(operationKey);
        timersRef.current.delete(operationKey);
        if (!pendingOperation) {
          return;
        }
        void updateRubric(pendingOperation);
      }, 300);
      timersRef.current.set(operationKey, timer);
    },
    [updateRubric]
  );

  useEffect(() => {
    return () => {
      void flushPendingUpdates();
    };
  }, [flushPendingUpdates]);

  useEffect(() => {
    if (!listQuery.isSuccess) {
      return;
    }
    if (listQuery.data.rubrics.length === 0) {
      dispatch({ type: 'rubric/select', payload: null });
      dispatch({ type: 'rubric/setInteractionMode', payload: 'viewing' });
      return;
    }

    const selectedStillExists = selectedRubricId
      ? listQuery.data.rubrics.some((rubric) => rubric.entityUuid === selectedRubricId)
      : false;
    if (selectedStillExists) {
      return;
    }

    const preferredRubricId =
      listQuery.data.lastUsedRubricId &&
      listQuery.data.rubrics.some((rubric) => rubric.entityUuid === listQuery.data.lastUsedRubricId)
        ? listQuery.data.lastUsedRubricId
        : listQuery.data.rubrics[0].entityUuid;
    dispatch({ type: 'rubric/select', payload: preferredRubricId });
    dispatch({ type: 'rubric/setInteractionMode', payload: 'viewing' });
  }, [dispatch, listQuery.data, listQuery.isSuccess, selectedRubricId]);

  const selectedRubric = listQuery.data?.rubrics.find((rubric) => rubric.entityUuid === selectedRubricId);
  const canEditSelectedRubric = selectedRubric ? !selectedRubric.isActive : true;

  return (
    <div className="rubric-tab workspace rubric" data-testid="rubric-tab">
      <section className="rubric-selection-view subpane" aria-label="Rubric selection view">
        <h4>Rubric Selection</h4>
        <div className="content-block" role="listbox" aria-label="Rubrics">
          {listQuery.isPending ? <div>Loading rubrics...</div> : null}
          {listQuery.isError ? <div>Unable to load rubrics.</div> : null}
          {listQuery.isSuccess && listQuery.data.rubrics.length === 0 ? <div>No rubrics available.</div> : null}
          {listQuery.data?.rubrics.map((rubric) => (
            <button
              key={rubric.entityUuid}
              type="button"
              className={selectedRubricId === rubric.entityUuid ? 'tab active is-active' : 'tab'}
              aria-selected={selectedRubricId === rubric.entityUuid}
              onClick={() => {
                void flushPendingUpdates();
                dispatch({ type: 'rubric/select', payload: rubric.entityUuid });
                dispatch({ type: 'rubric/setInteractionMode', payload: 'viewing' });
                void setLastUsed(rubric.entityUuid);
              }}
            >
              {rubric.name}
            </button>
          ))}
        </div>
        <div className="content-block">
          <button
            type="button"
            onClick={async () => {
              void flushPendingUpdates();
              const createdRubricId = await createRubric('New Rubric');
              dispatch({ type: 'rubric/select', payload: createdRubricId });
              dispatch({ type: 'rubric/setInteractionMode', payload: 'editing' });
            }}
          >
            New Rubric
          </button>
        </div>
      </section>
      <section className="rubric-view subpane" aria-label="Rubric view">
        <h4>Rubric</h4>
        <div className="content-block">
          {!selectedRubricId ? <div>Select a rubric to begin.</div> : null}
          {selectedRubricId && draftQuery.isPending ? <div>Loading rubric...</div> : null}
          {selectedRubricId && draftQuery.isError ? <div>Unable to load rubric.</div> : null}
          {selectedRubricId && selectedRubric ? (
            <div className="rubric-toolbar__controls">
              <button
                type="button"
                onClick={async () => {
                  void flushPendingUpdates();
                  const clonedRubricId = await cloneRubric(selectedRubricId);
                  dispatch({ type: 'rubric/select', payload: clonedRubricId });
                  dispatch({ type: 'rubric/setInteractionMode', payload: 'editing' });
                  await setLastUsed(clonedRubricId);
                }}
              >
                Clone
              </button>
              {!selectedRubric.isActive ? (
                <button
                  type="button"
                  onClick={async () => {
                    const shouldDelete = window.confirm('Delete this rubric permanently?');
                    if (!shouldDelete) {
                      return;
                    }
                    void flushPendingUpdates();
                    await deleteRubric(selectedRubricId);
                    dispatch({ type: 'rubric/select', payload: null });
                    dispatch({ type: 'rubric/setInteractionMode', payload: 'viewing' });
                  }}
                >
                  Delete
                </button>
              ) : null}
            </div>
          ) : null}
          {selectedRubricId && draftQuery.data ? (
            <RubricForReact
              sourceData={draftQuery.data}
              mode={interactionMode}
              canEdit={canEditSelectedRubric}
              onModeChange={(mode) => {
                void flushPendingUpdates();
                dispatch({ type: 'rubric/setInteractionMode', payload: mode });
              }}
              onSetRubricName={(name) => scheduleUpdate('rubric-name', { type: 'setRubricName', name })}
              onAddCategory={(name) => updateRubric({ type: 'createCategory', name })}
              onAddScore={(value) => updateRubric({ type: 'createScore', value })}
              onRenameCategory={(from, to) => updateRubric({ type: 'updateCategoryName', from, to })}
              onRemoveCategory={(category) => updateRubric({ type: 'deleteCategory', category })}
              onSetScoreValue={(from, to) => updateRubric({ type: 'updateScoreValue', from, to })}
              onRemoveScore={(value) => updateRubric({ type: 'deleteScore', value })}
              onSetCellDescription={(detailId, description) =>
                scheduleUpdate(`detail:${detailId}`, { type: 'updateCellDescription', detailId, description })
              }
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
