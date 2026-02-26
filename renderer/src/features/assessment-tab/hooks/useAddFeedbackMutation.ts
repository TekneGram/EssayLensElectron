import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Dispatch } from 'react';
import { toast } from 'react-toastify';
import type {
  AddBlockFeedbackRequest,
  AddFeedbackRequest,
  AddInlineFeedbackRequest
} from '../../../../../electron/shared/assessmentContracts';
import type { FeedbackItem } from '../../feedback/domain';
import { usePorts } from '../../../ports';
import { addAssessmentFeedback } from '../application/assessmentApi.service';
import type { AssessmentTabAction } from '../state';
import { assessmentQueryKeys } from './queryKeys';

type AddInlineFeedbackDraft = Omit<AddInlineFeedbackRequest, 'fileId'>;
type AddBlockFeedbackDraft = Omit<AddBlockFeedbackRequest, 'fileId'>;
type AddFeedbackDraft = AddInlineFeedbackDraft | AddBlockFeedbackDraft;

interface UseAddFeedbackMutationResult {
  addFeedback: (request: AddFeedbackDraft) => Promise<FeedbackItem>;
  errorMessage?: string;
  isPending: boolean;
}

export function useAddFeedbackMutation(
  selectedFileId: string | null,
  dispatch: Dispatch<AssessmentTabAction>
): UseAddFeedbackMutationResult {
  const { assessment } = usePorts();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (request: AddFeedbackDraft) => {
      if (!selectedFileId) {
        throw new Error('Select a file before adding feedback.');
      }
      if (request.kind === 'inline') {
        return addAssessmentFeedback(assessment, {
          ...request,
          fileId: selectedFileId
        });
      }
      return addAssessmentFeedback(assessment, {
        ...request,
        fileId: selectedFileId
      });
    },
    onMutate: () => {
      dispatch({ type: 'assessmentTab/setFeedbackStatus', payload: 'loading' });
      dispatch({ type: 'assessmentTab/setFeedbackError', payload: undefined });
    },
    onSuccess: async (feedback) => {
      dispatch({ type: 'assessmentTab/addFeedback', payload: feedback });
      dispatch({ type: 'assessmentTab/setFeedbackStatus', payload: 'idle' });
      dispatch({ type: 'assessmentTab/setFeedbackError', payload: undefined });

      if (selectedFileId) {
        await queryClient.invalidateQueries({
          queryKey: assessmentQueryKeys.feedbackList(selectedFileId)
        });
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unable to add feedback.';
      dispatch({ type: 'assessmentTab/setFeedbackStatus', payload: 'error' });
      dispatch({ type: 'assessmentTab/setFeedbackError', payload: message });
      toast.error(message);
    }
  });

  return {
    addFeedback: mutation.mutateAsync,
    errorMessage: mutation.error instanceof Error ? mutation.error.message : undefined,
    isPending: mutation.isPending
  };
}
