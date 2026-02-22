import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppState } from '../../../../state';
import { RubricForReact } from '../../../rubric-tab/components';
import { rubricQueryKeys, useRubricDraftQuery, useRubricListQuery } from '../../../rubric-tab/hooks';
import {
  clearAppliedRubric,
  getFileRubricScores,
  getRubricGradingContext,
  saveFileRubricScores
} from '../../../rubric-tab/services';
import { createCellKey } from '../../../rubric-tab/services/normalize';

export function ScoreTool() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [isResettingAfterRubricClear, setIsResettingAfterRubricClear] = useState(false);

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
      return await getRubricGradingContext(fileId);
    }
  });
  const lockedFromDb = gradingContextQuery.data?.lockedRubricId ?? null;
  const selectedFromDb = gradingContextQuery.data?.selectedRubricIdForFile ?? null;
  const preferredRubricId =
    lockedFromDb ??
    gradingRubricId ??
    selectedFromDb ??
    listQuery.data?.lastUsedRubricId ??
    listQuery.data?.rubrics[0]?.entityUuid ??
    null;

  const effectiveRubricId = lockedFromDb ?? gradingRubricId ?? preferredRubricId;
  const draftQuery = useRubricDraftQuery(effectiveRubricId);
  const fileScoresQuery = useQuery({
    queryKey: rubricQueryKeys.fileScores(fileId ?? 'none', effectiveRubricId ?? 'none'),
    enabled: Boolean(fileId && effectiveRubricId),
    queryFn: async () => {
      if (!fileId || !effectiveRubricId) {
        return null;
      }
      return await getFileRubricScores(fileId, effectiveRubricId);
    }
  });
  const gradingSelection = fileId && effectiveRubricId ? state.rubric.gradingSelectionByFileId[fileId] : undefined;
  const selectedCellKeys = gradingSelection?.rubricId === effectiveRubricId ? gradingSelection.selectedCellKeys : [];
  const normalizedSelectedCellKeys = [...selectedCellKeys].sort().join('||');

  const saveScoresMutation = useMutation({
    mutationFn: async (nextSelectedCellKeys: string[]) => {
      if (!fileId || !effectiveRubricId || !draftQuery.data) {
        return;
      }

      const scoreById = new Map(draftQuery.data.scores?.map((score) => [score.id, score.value]));
      const cellsByKey = new Map(
        (draftQuery.data.cells ?? []).map((cell) => [createCellKey(cell.categoryId, cell.scoreId), cell])
      );
      const selections = nextSelectedCellKeys
        .map((key) => cellsByKey.get(key))
        .filter((cell): cell is NonNullable<typeof cell> => Boolean(cell?.detailId))
        .filter((cell) => !cell.detailId?.startsWith('temp_') && !cell.detailId?.startsWith('temp:'))
        .map((cell) => ({
          rubricDetailId: cell.detailId as string,
          assignedScore: String(scoreById.get(cell.scoreId) ?? '')
        }))
        .filter((selection) => selection.assignedScore.trim().length > 0);

      if (selections.length === 0) {
        return;
      }

      await saveFileRubricScores(fileId, effectiveRubricId, selections);
    },
    onSuccess: async () => {
      if (!fileId || !effectiveRubricId) {
        return;
      }
      await queryClient.invalidateQueries({ queryKey: rubricQueryKeys.gradingContext(fileId) });
      await queryClient.invalidateQueries({ queryKey: rubricQueryKeys.fileScores(fileId, effectiveRubricId) });
      await queryClient.invalidateQueries({ queryKey: rubricQueryKeys.list() });
    }
  });

  const clearAppliedMutation = useMutation({
    mutationFn: async () => {
      if (!fileId || !effectiveRubricId) {
        return;
      }
      await clearAppliedRubric(fileId, effectiveRubricId);
    },
    onSuccess: async () => {
      if (!fileId) {
        return;
      }
      setIsResettingAfterRubricClear(true);

      const clearedRubricId = effectiveRubricId;
      queryClient.setQueryData(rubricQueryKeys.gradingContext(fileId), {
        fileId,
        lockedRubricId: undefined,
        selectedRubricIdForFile: undefined
      });
      if (clearedRubricId) {
        queryClient.setQueryData(rubricQueryKeys.fileScores(fileId, clearedRubricId), {
          instance: null,
          scores: []
        });
      }

      dispatch({ type: 'rubric/clearGradingSelection', payload: { fileId } });
      dispatch({ type: 'rubric/selectGradingForFile', payload: { fileId, rubricId: null } });
      dispatch({ type: 'rubric/setLockedGradingRubricId', payload: null });
      await queryClient.invalidateQueries({ queryKey: rubricQueryKeys.gradingContext(fileId) });
      if (effectiveRubricId) {
        await queryClient.invalidateQueries({ queryKey: rubricQueryKeys.fileScores(fileId, effectiveRubricId) });
      }
      await queryClient.invalidateQueries({ queryKey: rubricQueryKeys.list() });
    }
  });

  useEffect(() => {
    if (!isResettingAfterRubricClear) {
      return;
    }
    const hasLockedRubric = Boolean(lockedFromDb);
    const hasSelectedCells = normalizedSelectedCellKeys.length > 0;
    const hasSavedScores = (fileScoresQuery.data?.scores.length ?? 0) > 0;
    if (!hasLockedRubric && !hasSelectedCells && !hasSavedScores) {
      setIsResettingAfterRubricClear(false);
    }
  }, [
    fileScoresQuery.data?.scores.length,
    isResettingAfterRubricClear,
    lockedFromDb,
    normalizedSelectedCellKeys
  ]);

  useEffect(() => {
    if (!fileId) {
      return;
    }
    if (lockedGradingRubricId !== lockedFromDb) {
      dispatch({ type: 'rubric/setLockedGradingRubricId', payload: lockedFromDb });
    }
  }, [dispatch, fileId, lockedFromDb, lockedGradingRubricId]);

  useEffect(() => {
    if (!fileId || !effectiveRubricId) {
      return;
    }
    if (effectiveRubricId === gradingRubricId) {
      return;
    }
    dispatch({
      type: 'rubric/selectGradingForFile',
      payload: { fileId, rubricId: effectiveRubricId }
    });
  }, [dispatch, effectiveRubricId, fileId, gradingRubricId]);

  useEffect(() => {
    if (!fileId || !effectiveRubricId || !draftQuery.data || !fileScoresQuery.data) {
      return;
    }
    const cellKeyByDetailId = new Map(
      (draftQuery.data.cells ?? [])
        .filter((cell) => Boolean(cell.detailId))
        .map((cell) => [cell.detailId as string, createCellKey(cell.categoryId, cell.scoreId)])
    );
    const hydratedSelection = fileScoresQuery.data.scores
      .map((score) => cellKeyByDetailId.get(score.rubricDetailUuid))
      .filter((value): value is string => Boolean(value));
    const normalizedHydrated = [...hydratedSelection].sort().join('||');
    if (normalizedHydrated === normalizedSelectedCellKeys) {
      return;
    }
    dispatch({
      type: 'rubric/setGradingSelection',
      payload: {
        fileId,
        rubricId: effectiveRubricId,
        selectedCellKeys: hydratedSelection
      }
    });
  }, [dispatch, draftQuery.data, effectiveRubricId, fileId, fileScoresQuery.data, normalizedSelectedCellKeys]);

  if (!fileId) {
    return <div>Select a file before scoring.</div>;
  }

  if (listQuery.isPending || gradingContextQuery.isPending || fileScoresQuery.isPending) {
    return <div>Loading rubrics...</div>;
  }

  if (listQuery.isError || gradingContextQuery.isError || fileScoresQuery.isError) {
    return <div>Unable to load rubrics for scoring.</div>;
  }

  if (!listQuery.data || listQuery.data.rubrics.length === 0) {
    return <div>No rubrics are available for scoring.</div>;
  }

  if (!effectiveRubricId || draftQuery.isPending) {
    return <div>Loading rubric...</div>;
  }

  if (draftQuery.isError || !draftQuery.data) {
    return <div>Unable to load rubric for scoring.</div>;
  }

  return (
    <>
      <div className="content-block">
        {lockedFromDb ? (
          <>
            <div>Applied rubric: {listQuery.data.rubrics.find((rubric) => rubric.entityUuid === effectiveRubricId)?.name}</div>
            <button
              type="button"
              onClick={() => {
                const confirmed = window.confirm(
                  'Are you sure you want to change the rubric? ALL scores on ALL documents will be removed and you will need to rescore all the documents'
                );
                if (!confirmed) {
                  return;
                }
                clearAppliedMutation.mutate();
              }}
              disabled={clearAppliedMutation.isPending}
            >
              {clearAppliedMutation.isPending ? 'Changing...' : 'Change Rubric'}
            </button>
          </>
        ) : (
          <>
            <label htmlFor="grading-rubric-select">Grading rubric</label>{' '}
            <select
              id="grading-rubric-select"
              value={effectiveRubricId}
              onChange={(event) => {
                dispatch({
                  type: 'rubric/selectGradingForFile',
                  payload: {
                    fileId,
                    rubricId: event.target.value
                  }
                });
              }}
            >
              {listQuery.data.rubrics.map((rubric) => (
                <option key={rubric.entityUuid} value={rubric.entityUuid}>
                  {rubric.name}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
      <RubricForReact
        sourceData={draftQuery.data}
        isGrading
        displayMode="compact-score"
        initialSelectedCellKeys={selectedCellKeys}
        onSelectedCellKeysChange={(nextSelectedCellKeys) => {
          if (clearAppliedMutation.isPending || isResettingAfterRubricClear) {
            return;
          }
          const normalizedNext = [...nextSelectedCellKeys].sort().join('||');
          if (normalizedNext === normalizedSelectedCellKeys) {
            return;
          }
          dispatch({
            type: 'rubric/setGradingSelection',
            payload: {
              fileId,
              rubricId: effectiveRubricId,
              selectedCellKeys: nextSelectedCellKeys
            }
          });
          saveScoresMutation.mutate(nextSelectedCellKeys);
        }}
      />
    </>
  );
}
