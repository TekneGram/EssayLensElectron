import { useEffect } from 'react';
import { useAppDispatch, useAppState } from '../../../state';
import { useRubricDraftQuery, useRubricListQuery } from '../hooks';
import { RubricForReact } from './RubricForReact';

export function RubricTab() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const selectedRubricId = state.rubric.selectedRubricId;
  const interactionMode = state.rubric.interactionMode;

  const listQuery = useRubricListQuery();
  const draftQuery = useRubricDraftQuery(selectedRubricId);

  useEffect(() => {
    if (!listQuery.isSuccess || selectedRubricId || listQuery.data.length === 0) {
      return;
    }
    dispatch({ type: 'rubric/select', payload: listQuery.data[0].entityUuid });
  }, [dispatch, listQuery.data, listQuery.isSuccess, selectedRubricId]);

  return (
    <div className="rubric-tab workspace rubric" data-testid="rubric-tab">
      <section className="rubric-selection-view subpane" aria-label="Rubric selection view">
        <h4>Rubric Selection</h4>
        <div className="content-block" role="listbox" aria-label="Rubrics">
          {listQuery.isPending ? <div>Loading rubrics...</div> : null}
          {listQuery.isError ? <div>Unable to load rubrics.</div> : null}
          {listQuery.isSuccess && listQuery.data.length === 0 ? <div>No rubrics available.</div> : null}
          {listQuery.data?.map((rubric) => (
            <button
              key={rubric.entityUuid}
              type="button"
              className={selectedRubricId === rubric.entityUuid ? 'tab active is-active' : 'tab'}
              aria-selected={selectedRubricId === rubric.entityUuid}
              onClick={() => dispatch({ type: 'rubric/select', payload: rubric.entityUuid })}
            >
              {rubric.name}
            </button>
          ))}
        </div>
        <div className="content-block" role="radiogroup" aria-label="Rubric interaction mode">
          <button
            type="button"
            className={interactionMode === 'editing' ? 'tab active is-active' : 'tab'}
            onClick={() => dispatch({ type: 'rubric/setInteractionMode', payload: 'editing' })}
          >
            Editing
          </button>
          <button
            type="button"
            className={interactionMode === 'viewing' ? 'tab active is-active' : 'tab'}
            onClick={() => dispatch({ type: 'rubric/setInteractionMode', payload: 'viewing' })}
          >
            Viewing
          </button>
        </div>
      </section>
      <section className="rubric-view subpane" aria-label="Rubric view">
        <h4>Rubric</h4>
        <div className="content-block">
          {!selectedRubricId ? <div>Select a rubric to begin.</div> : null}
          {selectedRubricId && draftQuery.isPending ? <div>Loading rubric...</div> : null}
          {selectedRubricId && draftQuery.isError ? <div>Unable to load rubric.</div> : null}
          {selectedRubricId && draftQuery.data ? (
            <RubricForReact
              sourceData={draftQuery.data}
              mode={interactionMode}
              onModeChange={(mode) => dispatch({ type: 'rubric/setInteractionMode', payload: mode })}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
