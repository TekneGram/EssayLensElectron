import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateRubricOperation } from '../../../../../electron/shared/rubricContracts';
import { createRubric as createRubricRequest, setLastUsedRubric, updateRubricMatrix } from '../services/rubricApi';
import { rubricQueryKeys } from './queryKeys';

export function useRubricMutations(rubricId: string | null) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (operation: UpdateRubricOperation) => {
      if (!rubricId) {
        throw new Error('Select a rubric before updating it.');
      }
      await updateRubricMatrix({ rubricId, operation });
    },
    onSuccess: async () => {
      if (!rubricId) {
        return;
      }
      await queryClient.invalidateQueries({ queryKey: rubricQueryKeys.matrix(rubricId) });
      await queryClient.invalidateQueries({ queryKey: rubricQueryKeys.list() });
    }
  });

  const setLastUsedMutation = useMutation({
    mutationFn: async (nextRubricId: string) => {
      await setLastUsedRubric(nextRubricId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rubricQueryKeys.list() });
    }
  });

  const createRubricMutation = useMutation<string, Error, string>({
    mutationFn: async (name = 'New Rubric') => {
      const result = await createRubricRequest(name);
      return result.rubricId;
    },
    onSuccess: async (createdRubricId) => {
      await queryClient.invalidateQueries({ queryKey: rubricQueryKeys.list() });
      await queryClient.invalidateQueries({ queryKey: rubricQueryKeys.matrix(createdRubricId) });
    }
  });

  return {
    updateRubric: mutation.mutateAsync,
    setLastUsed: setLastUsedMutation.mutateAsync,
    createRubric: createRubricMutation.mutateAsync,
    isPending: mutation.isPending,
    errorMessage: mutation.error instanceof Error ? mutation.error.message : undefined
  };
}
