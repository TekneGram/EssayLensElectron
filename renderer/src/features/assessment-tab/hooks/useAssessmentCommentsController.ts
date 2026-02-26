import { useAssessmentCommentsActions } from './comments/useAssessmentCommentsActions';
import { useAssessmentCommentsStateSync } from './comments/useAssessmentCommentsStateSync';
import { useFeedbackListQuery } from './useFeedbackListQuery';
import type { AssessmentTabAction, AssessmentTabLocalState } from '../state';
import type { AssessmentTabChatBindings } from '../types';
import type { AppState } from '../../../state/types';
import type { SelectedFileType } from '../../../state';
import type { AppAction } from '../../../state/actions';
import type { Dispatch } from 'react';
import type { PendingSelection } from '../../chat-interface/domain';
import type { FeedbackItem } from '../../feedback/domain';

interface UseAssessmentCommentsControllerParams {
  appState: AppState;
  appDispatch: Dispatch<AppAction>;
  localState: AssessmentTabLocalState;
  localDispatch: Dispatch<AssessmentTabAction>;
  selectedFileId: string | null;
  selectedFileType: SelectedFileType;
  isAddFeedbackPending: boolean;
  addFeedbackErrorMessage?: string;
  setActiveCommandWithModeRule: (command: AssessmentTabChatBindings['activeCommand']) => void;
}

interface UseAssessmentCommentsControllerResult {
  comments: FeedbackItem[];
  pendingSelection: PendingSelection | null;
  activeCommentId: string | null;
  activeCommentsTab: import('../../../state').CommentsTab;
  isCommentsLoading: boolean;
  isGenerateFeedbackPending: boolean;
  canGenerateFeedbackDocument: boolean;
  commentsError?: string;
  onSelectionCaptured: (selection: PendingSelection | null) => void;
  onSelectComment: (commentId: string) => void;
  onEditComment: (commentId: string, nextText: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onApplyComment: (commentId: string, applied: boolean) => Promise<void>;
  onSendToLlm: (commentId: string, commandId?: string) => Promise<void>;
  onGenerateFeedbackDocument: () => Promise<void>;
  onCommentsTabChange: (tab: import('../../../state').CommentsTab) => void;
}

export function useAssessmentCommentsController({
  appState,
  appDispatch,
  localState,
  localDispatch,
  selectedFileId,
  selectedFileType,
  isAddFeedbackPending,
  addFeedbackErrorMessage,
  setActiveCommandWithModeRule
}: UseAssessmentCommentsControllerParams): UseAssessmentCommentsControllerResult {
  const feedbackListQuery = useFeedbackListQuery(selectedFileId);

  const synced = useAssessmentCommentsStateSync({
    appState,
    localState,
    feedbackListQuery,
    selectedFileType,
    isAddFeedbackPending,
    addFeedbackErrorMessage
  });

  const actions = useAssessmentCommentsActions({
    appDispatch,
    localDispatch,
    selectedFileId,
    feedbackListQuery,
    comments: synced.comments,
    canGenerateFeedbackDocument: synced.canGenerateFeedbackDocument,
    setActiveCommandWithModeRule
  });

  return {
    ...synced,
    ...actions
  };
}
