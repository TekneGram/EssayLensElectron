import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import type {
  AddBlockFeedbackRequest,
  AddFeedbackRequest,
  AddInlineFeedbackRequest
} from '../../../../../electron/shared/assessmentContracts';
import { useAppDispatch } from '../../../state';
import type { FeedbackItem } from '../../../types';
import { addFeedback } from './feedbackApi';
import { assessmentQueryKeys } from './queryKeys';

type AddInlineFeedbackDraft = Omit<AddInlineFeedbackRequest, 'fileId'>;
type AddBlockFeedbackDraft = Omit<AddBlockFeedbackRequest, 'fileId'>;
type AddFeedbackDraft = AddInlineFeedbackDraft | AddBlockFeedbackDraft;

interface UseAddFeedbackMutationResult {
  addFeedback: (request: AddFeedbackDraft) => Promise<FeedbackItem>;
  errorMessage?: string;
  isPending: boolean;
}

export function useAddFeedbackMutation(selectedFileId: string | null): UseAddFeedbackMutationResult {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (request: AddFeedbackDraft) => {
      if (!selectedFileId) {
        throw new Error('Select a file before adding feedback.');
      }
      if (request.kind === 'inline') {
        return addFeedback({
          ...request,
          fileId: selectedFileId
        });
      }
      return addFeedback({
        ...request,
        fileId: selectedFileId
      });
    },
    onMutate: () => {
      dispatch({ type: 'feedback/setStatus', payload: 'loading' });
      dispatch({ type: 'feedback/setError', payload: undefined });
    },
    onSuccess: async (feedback) => {
      dispatch({ type: 'feedback/add', payload: feedback });
      dispatch({ type: 'feedback/setStatus', payload: 'idle' });
      dispatch({ type: 'feedback/setError', payload: undefined });

      if (selectedFileId) {
        await queryClient.invalidateQueries({
          queryKey: assessmentQueryKeys.feedbackList(selectedFileId)
        });
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unable to add feedback.';
      dispatch({ type: 'feedback/setStatus', payload: 'error' });
      dispatch({ type: 'feedback/setError', payload: message });
      toast.error(message);
    }
  });

  return {
    addFeedback: mutation.mutateAsync,
    errorMessage: mutation.error instanceof Error ? mutation.error.message : undefined,
    isPending: mutation.isPending
  };
}
