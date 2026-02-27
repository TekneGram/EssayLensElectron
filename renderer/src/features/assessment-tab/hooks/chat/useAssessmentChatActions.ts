import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch } from 'react';
import { toast } from 'react-toastify';
import type {
  AddBlockFeedbackRequest,
  AddInlineFeedbackRequest
} from '../../../../../../electron/shared/assessmentContracts';
import { usePorts } from '../../../../ports';
import { useAppState } from '../../../../state';
import type { FeedbackItem } from '../../../feedback/domain';
import { toChatErrorMessage } from '../../domain/assessmentTab.logic';
import { handleChatStreamChunkWorkflow, submitChatMessageWorkflow } from '../../application/chatWorkflow.service';
import { submitCommentFeedbackWorkflow } from '../../application/commentsWorkflow.service';
import { bumpSessionSyncForFile, selectActiveSessionIdForFile, setChatError } from '../../../chat-interface/state';
import { resolveSessionIdForSend } from '../../../chat-interface/domain';
import { selectIsModeLockedToChat } from '../../state';
import type { AssessmentTabAction, AssessmentTabLocalState } from '../../state';
import type { AppAction } from '../../../../state/actions';
import type { AssessmentTabChatBindings } from '../../types';

type AddFeedbackDraft = Omit<AddInlineFeedbackRequest, 'fileId'> | Omit<AddBlockFeedbackRequest, 'fileId'>;

interface UseAssessmentChatActionsParams {
  appDispatch: Dispatch<AppAction>;
  localState: AssessmentTabLocalState;
  localDispatch: Dispatch<AssessmentTabAction>;
  selectedFileId: string | null;
  addFeedback: (request: AddFeedbackDraft) => Promise<FeedbackItem>;
}

interface UseAssessmentChatActionsResult {
  handleModeChange: (mode: AssessmentTabChatBindings['chatMode']) => void;
  handleSubmit: () => Promise<void>;
  setDraftText: (text: string) => void;
  isModeLockedToChat: boolean;
  isChatSendDisabled: boolean;
}

export function useAssessmentChatActions({
  appDispatch,
  localState,
  localDispatch,
  selectedFileId,
  addFeedback
}: UseAssessmentChatActionsParams): UseAssessmentChatActionsResult {
  const { chat: chatApi } = usePorts();
  const appState = useAppState();
  const { pendingSelection, chatMode, draftText } = localState;
  const isModeLockedToChat = selectIsModeLockedToChat(localState);
  const activeSessionId = selectActiveSessionIdForFile(appState, selectedFileId);
  const resolvedSessionId = selectedFileId ? resolveSessionIdForSend(selectedFileId, activeSessionId) : undefined;
  const isChatSendDisabled = !selectedFileId;

  const streamMessageByClientRequestId = useRef(new Map<string, string>());
  const streamSeqByClientRequestId = useRef(new Map<string, number>());

  const setDraftText = useCallback(
    (text: string) => {
      localDispatch({ type: 'assessmentTab/setDraftText', payload: text });
    },
    [localDispatch]
  );

  const handleModeChange = useCallback(
    (mode: AssessmentTabChatBindings['chatMode']) => {
      if (isModeLockedToChat && mode === 'comment') {
        return;
      }
      localDispatch({ type: 'assessmentTab/setChatMode', payload: mode });
    },
    [isModeLockedToChat, localDispatch]
  );

  const handleSubmit = useCallback(async () => {
    const message = draftText.trim();
    if (!message) {
      return;
    }

    if (chatMode === 'comment') {
      try {
        await submitCommentFeedbackWorkflow({
          message,
          pendingSelection,
          addFeedback,
          onInlineSelectionCommitted: () => {
            localDispatch({ type: 'assessmentTab/setPendingSelection', payload: null });
          }
        });
        localDispatch({ type: 'assessmentTab/setDraftText', payload: '' });
      } catch {
        // Mutation hook is responsible for setting feedback error state + toast.
      }
      return;
    }

    if (!selectedFileId) {
      const message = 'Select a file before sending chat messages.';
      appDispatch(setChatError(message));
      toast.error(message);
      return;
    }

    try {
      localDispatch({ type: 'assessmentTab/setDraftText', payload: '' });
      await submitChatMessageWorkflow({
        chatApi,
        dispatch: appDispatch,
        message,
        selectedFileId,
        activeSessionId: resolvedSessionId,
        pendingSelection,
        streamMessageByClientRequestId: streamMessageByClientRequestId.current,
        streamSeqByClientRequestId: streamSeqByClientRequestId.current
      });
      appDispatch(bumpSessionSyncForFile({ fileId: selectedFileId }));
    } catch (error) {
      const errorMessage = toChatErrorMessage(error, 'Unable to send chat message.');
      toast.error(errorMessage);
    }
  }, [addFeedback, appDispatch, chatApi, chatMode, draftText, localDispatch, pendingSelection, resolvedSessionId, selectedFileId]);

  useEffect(() => {
    if (typeof chatApi.onStreamChunk !== 'function') {
      return;
    }

    const unsubscribe = chatApi.onStreamChunk((event) => {
      handleChatStreamChunkWorkflow({
        event,
        dispatch: appDispatch,
        streamMessageByClientRequestId: streamMessageByClientRequestId.current,
        streamSeqByClientRequestId: streamSeqByClientRequestId.current
      });
    });

    return () => {
      unsubscribe();
    };
  }, [appDispatch, chatApi]);

  return {
    handleModeChange,
    handleSubmit,
    setDraftText,
    isModeLockedToChat,
    isChatSendDisabled
  };
}
