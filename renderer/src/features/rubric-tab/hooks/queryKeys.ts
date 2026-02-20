export const rubricQueryKeys = {
  all: ['rubric'] as const,
  list: () => ['rubric', 'list'] as const,
  matrix: (rubricId: string) => ['rubric', rubricId, 'matrix'] as const
};
