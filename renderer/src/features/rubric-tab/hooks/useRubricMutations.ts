import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateRubricOperation } from '../../../../../electron/shared/rubricContracts';
import { updateRubricMatrix } from '../services/rubricApi';
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

  return {
    updateRubric: mutation.mutateAsync,
    isPending: mutation.isPending,
    errorMessage: mutation.error instanceof Error ? mutation.error.message : undefined
  };
}
