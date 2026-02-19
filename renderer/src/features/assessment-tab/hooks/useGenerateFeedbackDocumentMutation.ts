import { useMutation } from '@tanstack/react-query';
import { generateFeedbackDocument } from './feedbackApi';

interface UseGenerateFeedbackDocumentMutationResult {
  generateFeedbackDocumentForFile: () => Promise<{ fileId: string; outputPath: string }>;
  isPending: boolean;
  errorMessage?: string;
}

export function useGenerateFeedbackDocumentMutation(
  selectedFileId: string | null
): UseGenerateFeedbackDocumentMutationResult {
  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedFileId) {
        throw new Error('No file selected.');
      }
      return generateFeedbackDocument(selectedFileId);
    }
  });

  return {
    generateFeedbackDocumentForFile: () => mutation.mutateAsync(),
    isPending: mutation.isPending,
    errorMessage: mutation.error instanceof Error ? mutation.error.message : undefined
  };
}
