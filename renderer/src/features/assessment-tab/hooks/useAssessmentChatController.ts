import { useAssessmentChatActions } from './chat/useAssessmentChatActions';
import { useAssessmentChatStateSync } from './chat/useAssessmentChatStateSync';
import type { FeedbackItem } from '../../../types';
import type {
  AddBlockFeedbackRequest,
  AddInlineFeedbackRequest
} from '../../../../../electron/shared/assessmentContracts';
import type { AssessmentTabAction, AssessmentTabLocalState } from '../state';
import type { AssessmentTabChatBindings } from '../types';
import type { AppAction } from '../../../state/actions';
import type { Dispatch } from 'react';

type AddFeedbackDraft = Omit<AddInlineFeedbackRequest, 'fileId'> | Omit<AddBlockFeedbackRequest, 'fileId'>;

interface UseAssessmentChatControllerParams {
  appDispatch: Dispatch<AppAction>;
  localState: AssessmentTabLocalState;
  localDispatch: Dispatch<AssessmentTabAction>;
  selectedFileId: string | null;
  addFeedback: (request: AddFeedbackDraft) => Promise<FeedbackItem>;
  onChatBindingsChange?: (bindings: AssessmentTabChatBindings) => void;
  setActiveCommandWithModeRule: (command: AssessmentTabChatBindings['activeCommand']) => void;
}

interface UseAssessmentChatControllerResult {
  chatMode: AssessmentTabChatBindings['chatMode'];
  isModeLockedToChat: boolean;
}

export function useAssessmentChatController({
  appDispatch,
  localState,
  localDispatch,
  selectedFileId,
  addFeedback,
  onChatBindingsChange,
  setActiveCommandWithModeRule
}: UseAssessmentChatControllerParams): UseAssessmentChatControllerResult {
  const { handleModeChange, handleSubmit, setDraftText, isModeLockedToChat } = useAssessmentChatActions({
    appDispatch,
    localState,
    localDispatch,
    selectedFileId,
    addFeedback
  });

  useAssessmentChatStateSync({
    localState,
    isModeLockedToChat,
    setDraftText,
    handleSubmit,
    handleModeChange,
    setActiveCommandWithModeRule,
    onChatBindingsChange
  });

  return {
    chatMode: localState.chatMode,
    isModeLockedToChat
  };
}
