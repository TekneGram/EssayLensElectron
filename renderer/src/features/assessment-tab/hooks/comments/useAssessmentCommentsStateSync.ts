import { selectActiveCommentsTab } from '../../../../state';
import type { AppState } from '../../../../state/types';
import type { SelectedFileType } from '../../../../state';
import type { AssessmentTabLocalState } from '../../state';

interface UseAssessmentCommentsStateSyncParams {
  appState: AppState;
  localState: AssessmentTabLocalState;
  selectedFileId: string | null;
  selectedFileType: SelectedFileType;
  isAddFeedbackPending: boolean;
  addFeedbackErrorMessage?: string;
}

export function useAssessmentCommentsStateSync({
  appState,
  localState,
  selectedFileId,
  selectedFileType,
  isAddFeedbackPending,
  addFeedbackErrorMessage
}: UseAssessmentCommentsStateSyncParams) {
  const comments = selectedFileId ? localState.feedbackByFileId[selectedFileId] ?? [] : [];
  const canGenerateFeedbackDocument = selectedFileType === 'docx' && comments.length > 0;
  const activeCommentsTab = selectActiveCommentsTab(appState);

  return {
    comments,
    pendingSelection: localState.pendingSelection,
    activeCommentId: localState.activeCommentId,
    activeCommentsTab,
    isCommentsLoading: localState.feedbackStatus === 'loading' || isAddFeedbackPending,
    canGenerateFeedbackDocument,
    commentsError:
      localState.feedbackStatus === 'error'
        ? localState.feedbackError ?? addFeedbackErrorMessage ?? 'Unable to load comments.'
        : undefined
  };
}
