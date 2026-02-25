import { useRubricTabController } from './hooks';
import { RubricForReact } from './components/RubricForReact';
import { RubricSelection } from './components/RubricSelection';

export function RubricTab() {
  const controller = useRubricTabController();

  return (
    <div className="rubric-tab workspace rubric" data-testid="rubric-tab">
      <RubricSelection
        rubrics={controller.listQuery.data?.rubrics ?? []}
        selectedRubricId={controller.selectedRubricId}
        isPending={controller.listQuery.isPending}
        isError={controller.listQuery.isError}
        onSelect={controller.selectRubric}
        onCreate={controller.createRubric}
      />
      <section className="rubric-view subpane" aria-label="Rubric view">
        <h4>Rubric</h4>
        <div className="content-block">
          {!controller.selectedRubricId ? <div>Select a rubric to begin.</div> : null}
          {controller.selectedRubricId && controller.draftQuery.isPending ? <div>Loading rubric...</div> : null}
          {controller.selectedRubricId && controller.draftQuery.isError ? <div>Unable to load rubric.</div> : null}
          {controller.selectedRubricId && controller.selectedRubric ? (
            <div className="rubric-toolbar__controls">
              <button type="button" onClick={controller.cloneRubric}>
                Clone
              </button>
              {!controller.selectedRubric.isActive ? (
                <button
                  type="button"
                  onClick={async () => {
                    const shouldDelete = window.confirm('Delete this rubric permanently?');
                    if (!shouldDelete) {
                      return;
                    }
                    await controller.deleteRubric();
                  }}
                >
                  Delete
                </button>
              ) : null}
            </div>
          ) : null}
          {controller.selectedRubricId && controller.draftQuery.data ? (
            <RubricForReact
              sourceData={controller.draftQuery.data}
              mode={controller.interactionMode}
              canEdit={controller.canEditSelectedRubric}
              onModeChange={(mode) => {
                void controller.setInteractionMode(mode);
              }}
              onSetRubricName={(name) => controller.scheduleUpdate('rubric-name', { type: 'setRubricName', name })}
              onAddCategory={(name) => controller.updateRubric({ type: 'createCategory', name })}
              onAddScore={(value) => controller.updateRubric({ type: 'createScore', value })}
              onRenameCategory={(from, to) => controller.updateRubric({ type: 'updateCategoryName', from, to })}
              onRemoveCategory={(category) => controller.updateRubric({ type: 'deleteCategory', category })}
              onSetScoreValue={(from, to) => controller.updateRubric({ type: 'updateScoreValue', from, to })}
              onRemoveScore={(value) => controller.updateRubric({ type: 'deleteScore', value })}
              onSetCellDescription={(detailId, description) =>
                controller.scheduleUpdate(`detail:${detailId}`, { type: 'updateCellDescription', detailId, description })
              }
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
