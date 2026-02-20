import { useQuery } from '@tanstack/react-query';
import { getRubricMatrix, matrixToRubricSourceData } from '../services/rubricApi';
import { rubricQueryKeys } from './queryKeys';

export function useRubricDraftQuery(rubricId: string | null) {
  return useQuery({
    queryKey: rubricQueryKeys.matrix(rubricId ?? 'none'),
    enabled: Boolean(rubricId),
    queryFn: async () => {
      if (!rubricId) {
        return null;
      }
      const matrix = await getRubricMatrix(rubricId);
      return matrixToRubricSourceData(matrix);
    }
  });
}
