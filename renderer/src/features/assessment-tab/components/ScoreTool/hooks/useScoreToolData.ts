import { useQuery } from '@tanstack/react-query';
import { useAppState } from '../../../../../state';
import { rubricQueryKeys, useRubricDraftQuery, useRubricListQuery } from '../../../../rubric-tab/hooks';
import { getFileRubricScores, getRubricGradingContext } from '../infrastructure/scoreTool.api';
import { normalizeCellKeyList, resolveEffectiveRubricId, resolvePreferredRubricId } from '../domain/scoreTool.logic';

export function useScoreToolData() {
  const state = useAppState();
  const fileId = state.workspace.selectedFile.fileId;
  const listQuery = useRubricListQuery();
  const gradingRubricId = fileId ? state.rubric.selectedGradingRubricIdByFileId[fileId] ?? null : null;
  const lockedGradingRubricId = state.rubric.lockedGradingRubricId;

  const gradingContextQuery = useQuery({
    queryKey: rubricQueryKeys.gradingContext(fileId ?? 'none'),
    enabled: Boolean(fileId),
    queryFn: async () => {
      if (!fileId) {
        return null;
      }
      return getRubricGradingContext(fileId);
    }
  });

  const lockedFromDb = gradingContextQuery.data?.lockedRubricId ?? null;
  const selectedFromDb = gradingContextQuery.data?.selectedRubricIdForFile ?? null;

  const preferredRubricId = resolvePreferredRubricId({
    lockedFromDb,
    gradingRubricId,
    selectedFromDb,
    lastUsedRubricId: listQuery.data?.lastUsedRubricId,
    firstRubricId: listQuery.data?.rubrics[0]?.entityUuid
  });

  const effectiveRubricId = resolveEffectiveRubricId({
    lockedFromDb,
    gradingRubricId,
    preferredRubricId
  });

  const draftQuery = useRubricDraftQuery(effectiveRubricId);

  const fileScoresQuery = useQuery({
    queryKey: rubricQueryKeys.fileScores(fileId ?? 'none', effectiveRubricId ?? 'none'),
    enabled: Boolean(fileId && effectiveRubricId),
    queryFn: async () => {
      if (!fileId || !effectiveRubricId) {
        return null;
      }
      return getFileRubricScores(fileId, effectiveRubricId);
    }
  });

  const gradingSelection = fileId && effectiveRubricId ? state.rubric.gradingSelectionByFileId[fileId] : undefined;
  const selectedCellKeys = gradingSelection?.rubricId === effectiveRubricId ? gradingSelection.selectedCellKeys : [];
  const normalizedSelectedCellKeys = normalizeCellKeyList(selectedCellKeys);

  return {
    draftQuery,
    effectiveRubricId,
    fileId,
    fileScoresQuery,
    gradingContextQuery,
    gradingRubricId,
    listQuery,
    lockedFromDb,
    lockedGradingRubricId,
    normalizedSelectedCellKeys,
    selectedCellKeys
  };
}
