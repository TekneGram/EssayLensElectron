import { useCallback } from 'react';
import type { Dispatch } from 'react';
import { toast } from 'react-toastify';
import type { FeedbackItem } from '../../../../types';
import type { PendingSelection } from '../../../chat-interface/domain';
import { useGenerateFeedbackDocumentMutation } from '../useGenerateFeedbackDocumentMutation';
import { useFeedbackListQuery } from '../useFeedbackListQuery';
import { applyFeedback, deleteFeedback, editFeedback, sendFeedbackToLlm } from '../feedbackApi';
import {
  applyCommentWorkflow,
  deleteCommentWorkflow,
  editCommentWorkflow,
  selectPendingSelectionFromComments,
  sendCommentToLlmWorkflow,
  toSendToLlmActiveCommand
} from '../../application/commentsWorkflow.service';
import { generateFeedbackDocumentWorkflow } from '../../application/feedbackDocument.service';
import type { AssessmentTabAction } from '../../state';
import type { AssessmentTabChatBindings } from '../../types';
import { selectActiveCommentsTab } from '../../../../state';
import type { AppAction } from '../../../../state/actions';

interface UseAssessmentCommentsActionsParams {
  appDispatch: Dispatch<AppAction>;
  localDispatch: Dispatch<AssessmentTabAction>;
  selectedFileId: string | null;
  comments: FeedbackItem[];
  canGenerateFeedbackDocument: boolean;
  setActiveCommandWithModeRule: (command: AssessmentTabChatBindings['activeCommand']) => void;
}

export function useAssessmentCommentsActions({
  appDispatch,
  localDispatch,
  selectedFileId,
  comments,
  canGenerateFeedbackDocument,
  setActiveCommandWithModeRule
}: UseAssessmentCommentsActionsParams) {
  const feedbackListQuery = useFeedbackListQuery(selectedFileId);
  const {
    generateFeedbackDocumentForFile,
    isPending: isGenerateFeedbackPending,
    errorMessage: generateFeedbackErrorMessage
  } = useGenerateFeedbackDocumentMutation(selectedFileId);

  const onSelectionCaptured = useCallback(
    (selection: PendingSelection | null) => {
      localDispatch({ type: 'assessmentTab/setPendingSelection', payload: selection });
    },
    [localDispatch]
  );

  const onSelectComment = useCallback(
    (commentId: string) => {
      localDispatch({ type: 'assessmentTab/setActiveCommentId', payload: commentId });
      localDispatch({
        type: 'assessmentTab/setPendingSelection',
        payload: selectPendingSelectionFromComments(comments, commentId)
      });
    },
    [comments, localDispatch]
  );

  const onEditComment = useCallback(
    async (commentId: string, nextText: string) => {
      try {
        await editCommentWorkflow({
          commentId,
          nextText,
          editFeedback,
          refetchFeedback: feedbackListQuery.refetch
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to edit comment.';
        toast.error(message);
      }
    },
    [feedbackListQuery]
  );

  const onDeleteComment = useCallback(
    async (commentId: string) => {
      try {
        await deleteCommentWorkflow({
          commentId,
          deleteFeedback,
          refetchFeedback: feedbackListQuery.refetch,
          onDeletedCommentId: (deletedCommentId) => {
            localDispatch({ type: 'assessmentTab/clearActiveCommentIfMatch', payload: deletedCommentId });
          }
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to delete comment.';
        toast.error(message);
      }
    },
    [feedbackListQuery, localDispatch]
  );

  const onApplyComment = useCallback(
    async (commentId: string, applied: boolean) => {
      try {
        await applyCommentWorkflow({
          commentId,
          applied,
          applyFeedback,
          refetchFeedback: feedbackListQuery.refetch
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update apply state.';
        toast.error(message);
      }
    },
    [feedbackListQuery]
  );

  const onSendToLlm = useCallback(
    async (commentId: string, commandId?: string) => {
      try {
        await sendCommentToLlmWorkflow({
          commentId,
          commandId,
          sendFeedbackToLlm,
          refetchFeedback: feedbackListQuery.refetch,
          onBeforeSend: ({ commentId: nextCommentId, commandId: nextCommandId }) => {
            localDispatch({ type: 'assessmentTab/setActiveCommentId', payload: nextCommentId });
            setActiveCommandWithModeRule(toSendToLlmActiveCommand(nextCommandId));
          }
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to send comment to LLM.';
        toast.error(message);
      }
    },
    [feedbackListQuery, localDispatch, setActiveCommandWithModeRule]
  );

  const onGenerateFeedbackDocument = useCallback(async () => {
    try {
      const result = await generateFeedbackDocumentWorkflow({
        canGenerateFeedbackDocument,
        generateFeedbackDocumentForFile
      });
      if (!result) {
        return;
      }
      toast.success(`Generated feedback document: ${result.outputPath}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : generateFeedbackErrorMessage ?? 'Unable to generate feedback document.';
      toast.error(message);
    }
  }, [canGenerateFeedbackDocument, generateFeedbackDocumentForFile, generateFeedbackErrorMessage]);

  const onCommentsTabChange = useCallback(
    (tab: ReturnType<typeof selectActiveCommentsTab>) => {
      appDispatch({ type: 'ui/setCommentsTab', payload: tab });
    },
    [appDispatch]
  );

  return {
    isGenerateFeedbackPending,
    onSelectionCaptured,
    onSelectComment,
    onEditComment,
    onDeleteComment,
    onApplyComment,
    onSendToLlm,
    onGenerateFeedbackDocument,
    onCommentsTabChange
  };
}
