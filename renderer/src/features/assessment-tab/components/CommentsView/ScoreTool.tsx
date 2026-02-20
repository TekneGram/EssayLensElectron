import { useAppDispatch, useAppState } from '../../../../state';
import { RubricForReact } from '../../../rubric-tab/components';
import { useRubricDraftQuery } from '../../../rubric-tab/hooks';

export function ScoreTool() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const fileId = state.workspace.selectedFile.fileId;
  const rubricId = state.rubric.selectedRubricId;
  const draftQuery = useRubricDraftQuery(rubricId);

  const gradingSelection = fileId ? state.rubric.gradingSelectionByFileId[fileId] : undefined;
  const selectedCellKeys = gradingSelection?.rubricId === rubricId ? gradingSelection.selectedCellKeys : [];

  if (!fileId) {
    return <div>Select a file before scoring.</div>;
  }

  if (!rubricId) {
    return <div>Select a rubric in the Rubric tab first.</div>;
  }

  if (draftQuery.isPending) {
    return <div>Loading rubric...</div>;
  }

  if (draftQuery.isError || !draftQuery.data) {
    return <div>Unable to load rubric for scoring.</div>;
  }

  return (
    <RubricForReact
      sourceData={draftQuery.data}
      isGrading
      initialSelectedCellKeys={selectedCellKeys}
      onSelectedCellKeysChange={(nextSelectedCellKeys) => {
        dispatch({
          type: 'rubric/setGradingSelection',
          payload: {
            fileId,
            rubricId,
            selectedCellKeys: nextSelectedCellKeys
          }
        });
      }}
    />
  );
}
