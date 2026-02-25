import { useMutation } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import type { Dispatch } from 'react';
import type { AppAction } from '../../../../../state/actions';
import { useRubricDraftQuery } from '../../../../rubric-tab/hooks';
import { clearAppliedRubric, saveFileRubricScores } from '../infrastructure/scoreTool.api';
import { buildScoreSelectionsFromCellKeys, handleClearAppliedSuccess, invalidateRubricQueries } from '../application/scoreTool.workflows';
import { hasDraftCells } from '../domain/scoreTool.logic';

interface UseScoreToolMutationsArgs {
  fileId: string | null;
  effectiveRubricId: string | null;
  draftData: ReturnType<typeof useRubricDraftQuery>['data'];
  dispatch: Dispatch<AppAction>;
  queryClient: QueryClient;
  onStartResetAfterClear: () => void;
}

export function useScoreToolMutations(args: UseScoreToolMutationsArgs) {
  const saveScoresMutation = useMutation({
    mutationFn: async (nextSelectedCellKeys: string[]) => {
      if (!args.fileId || !args.effectiveRubricId || !hasDraftCells(args.draftData)) {
        return;
      }

      const selections = buildScoreSelectionsFromCellKeys(args.draftData, nextSelectedCellKeys);
      if (selections.length === 0) {
        return;
      }

      await saveFileRubricScores(args.fileId, args.effectiveRubricId, selections);
    },
    onSuccess: async () => {
      if (!args.fileId || !args.effectiveRubricId) {
        return;
      }
      await invalidateRubricQueries({ queryClient: args.queryClient, fileId: args.fileId, rubricId: args.effectiveRubricId });
    }
  });

  const clearAppliedMutation = useMutation({
    mutationFn: async () => {
      if (!args.fileId || !args.effectiveRubricId) {
        return;
      }
      await clearAppliedRubric(args.fileId, args.effectiveRubricId);
    },
    onSuccess: async () => {
      if (!args.fileId) {
        return;
      }
      args.onStartResetAfterClear();
      await handleClearAppliedSuccess({
        queryClient: args.queryClient,
        dispatch: args.dispatch,
        fileId: args.fileId,
        clearedRubricId: args.effectiveRubricId
      });
    }
  });

  return {
    clearAppliedMutation,
    saveScoresMutation
  };
}
