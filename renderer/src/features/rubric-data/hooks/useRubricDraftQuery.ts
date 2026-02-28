import { useQuery } from '@tanstack/react-query';
import { usePorts } from '../../../ports';
import { matrixToRubricSourceData } from '../domain/rubricMatrixMapper';
import { rubricQueryKeys } from './queryKeys';

export function useRubricDraftQuery(rubricId: string | null) {
  const { rubric } = usePorts();

  return useQuery({
    queryKey: rubricQueryKeys.matrix(rubricId ?? 'none'),
    enabled: Boolean(rubricId),
    queryFn: async () => {
      if (!rubricId) {
        return null;
      }
      const result = await rubric.getMatrix({ rubricId });
      if (!result.ok) {
        throw new Error(result.error.message || 'Unable to load rubric.');
      }
      return matrixToRubricSourceData(result.data);
    }
  });
}
