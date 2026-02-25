import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import type { AppResult } from '../../../../../electron/shared/appResult';
import type {
  ChatStreamChunkEvent,
  SendChatMessageRequest,
  SendChatMessageResponse
} from '../../../../../electron/shared/chatContracts';
import {
  addChatMessage,
  setChatError,
  setChatStatus,
  updateChatMessageContent
} from '../../chat-interface/state';
import type { ActiveCommand, ChatMode, PendingSelection } from '../../chat-interface/domain';
import { selectActiveCommentsTab, selectAssessmentSplitRatio, useAppDispatch, useAppState } from '../../../state';
import type { SelectedFileType } from '../../../state';
import { useAddFeedbackMutation, useFeedbackListQuery, useGenerateFeedbackDocumentMutation } from '../hooks';
import { applyFeedback, deleteFeedback, editFeedback, sendFeedbackToLlm } from '../hooks/feedbackApi';
import type { AssessmentTabChatBindings } from '../types';
import { CommentsView } from './CommentsView';
import { ImageView } from './ImageView';
import { OriginalTextView } from './OriginalTextView';

interface AssessmentTabProps {
  selectedFileType: SelectedFileType;
  onChatBindingsChange?: (bindings: AssessmentTabChatBindings) => void;
}

type ChatApi = {
  sendMessage: (request: SendChatMessageRequest) => Promise<AppResult<SendChatMessageResponse>>;
  onStreamChunk?: (listener: (event: ChatStreamChunkEvent) => void) => () => void;
};

function getChatApi(): ChatApi {
  const appWindow = window as Window & { api?: { chat?: ChatApi } };
  if (!appWindow.api?.chat) {
    throw new Error('window.api.chat is not available.');
  }
  return appWindow.api.chat;
}

export function AssessmentTab({ selectedFileType, onChatBindingsChange }: AssessmentTabProps) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const activeCommentsTab = selectActiveCommentsTab(state);
  const assessmentSplitRatio = selectAssessmentSplitRatio(state);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedFile = state.workspace.files.find((file) => file.id === state.workspace.selectedFile.fileId) ?? null;
  const selectedFileId = selectedFile?.id ?? null;
  const isImageViewOpen = selectedFileType === 'image';
  const mode = isImageViewOpen ? 'three-pane' : 'two-pane';
  const feedbackListQuery = useFeedbackListQuery(selectedFileId);
  const { addFeedback, isPending: isAddFeedbackPending, errorMessage: addFeedbackErrorMessage } =
    useAddFeedbackMutation(selectedFileId);
  const {
    generateFeedbackDocumentForFile,
    isPending: isGenerateFeedbackPending,
    errorMessage: generateFeedbackErrorMessage
  } = useGenerateFeedbackDocumentMutation(selectedFileId);
  const comments = selectedFileId ? state.feedback.byFileId[selectedFileId] ?? [] : [];
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);
  const [activeCommand, setActiveCommand] = useState<ActiveCommand | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>('comment');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const streamMessageByClientRequestId = useRef(new Map<string, string>());
  const streamSeqByClientRequestId = useRef(new Map<string, number>());
  const originalText =
    selectedFileType === 'docx' || selectedFileType === 'pdf'
      ? `OriginalTextView: ${selectedFile?.name ?? 'No file selected.'}`
      : 'OriginalTextView';
  const isModeLockedToChat = activeCommand !== null;
  const canGenerateFeedbackDocument = selectedFileType === 'docx' && comments.length > 0;

  const setActiveCommandWithModeRule = useCallback((command: ActiveCommand | null) => {
    setActiveCommand(command);
    setChatMode((currentMode) => {
      if (command) {
        return 'chat';
      }
      return currentMode;
    });
  }, []);

  const handleModeChange = useCallback(
    (mode: ChatMode) => {
      if (isModeLockedToChat && mode === 'comment') {
        return;
      }
      setChatMode(mode);
    },
    [isModeLockedToChat]
  );

  const handleSubmit = useCallback(async () => {
    const message = draftText.trim();
    if (!message) {
      return;
    }

    if (chatMode === 'comment') {
      try {
        if (pendingSelection) {
          await addFeedback({
            kind: 'inline',
            source: 'teacher',
            commentText: message,
            exactQuote: pendingSelection.exactQuote,
            prefixText: pendingSelection.prefixText,
            suffixText: pendingSelection.suffixText,
            startAnchor: pendingSelection.startAnchor,
            endAnchor: pendingSelection.endAnchor
          });
          setPendingSelection(null);
        } else {
          await addFeedback({
            kind: 'block',
            source: 'teacher',
            commentText: message
          });
        }
        setDraftText('');
      } catch {
        // Mutation hook is responsible for setting feedback error state + toast.
      }
      return;
    }

    const makeLocalId = (prefix: string): string => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `${prefix}-${crypto.randomUUID()}`;
      }
      return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    };

    const clientRequestId = makeLocalId('chatreq');
    const teacherMessageId = makeLocalId('teacher');
    const assistantMessageId = makeLocalId('assistant');
    const createdAt = new Date().toISOString();

    streamMessageByClientRequestId.current.set(clientRequestId, assistantMessageId);
    streamSeqByClientRequestId.current.set(clientRequestId, -1);

    dispatch(
      addChatMessage({
        id: teacherMessageId,
        role: 'teacher',
        content: message,
        relatedFileId: selectedFileId ?? undefined,
        createdAt
      })
    );
    dispatch(
      addChatMessage({
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        relatedFileId: selectedFileId ?? undefined,
        createdAt
      })
    );
    dispatch(setChatStatus('sending'));
    dispatch(setChatError(undefined));
    setDraftText('');

    try {
      const chatApi = getChatApi();
      const result = await chatApi.sendMessage({
        fileId: selectedFileId ?? undefined,
        message,
        contextText: pendingSelection?.exactQuote,
        clientRequestId
      });
      if (!result.ok) {
        throw new Error(result.error.message || 'Unable to send chat message.');
      }

      dispatch(
        updateChatMessageContent({
          messageId: assistantMessageId,
          content: result.data.reply,
          mode: 'replace'
        })
      );
      streamMessageByClientRequestId.current.delete(clientRequestId);
      streamSeqByClientRequestId.current.delete(clientRequestId);
      if (streamMessageByClientRequestId.current.size === 0) {
        dispatch(setChatStatus('idle'));
      }
    } catch (error) {
      streamMessageByClientRequestId.current.delete(clientRequestId);
      streamSeqByClientRequestId.current.delete(clientRequestId);
      const errorMessage = error instanceof Error ? error.message : 'Unable to send chat message.';
      dispatch(setChatStatus('error'));
      dispatch(setChatError(errorMessage));
      toast.error(errorMessage);
    }
  }, [addFeedback, chatMode, dispatch, draftText, pendingSelection, selectedFileId]);

  useEffect(() => {
    let chatApi: ChatApi;
    try {
      chatApi = getChatApi();
    } catch {
      return;
    }
    if (typeof chatApi.onStreamChunk !== 'function') {
      return;
    }

    const unsubscribe = chatApi.onStreamChunk((event) => {
      const clientRequestId = event.clientRequestId;
      const assistantMessageId = streamMessageByClientRequestId.current.get(clientRequestId);
      if (!assistantMessageId) {
        return;
      }

      const lastSeq = streamSeqByClientRequestId.current.get(clientRequestId) ?? -1;
      if (event.seq <= lastSeq) {
        return;
      }
      streamSeqByClientRequestId.current.set(clientRequestId, event.seq);

      if (event.type === 'chunk' && event.channel === 'content' && event.text) {
        dispatch(
          updateChatMessageContent({
            messageId: assistantMessageId,
            content: event.text,
            mode: 'append'
          })
        );
        return;
      }

      if (event.type === 'done') {
        streamMessageByClientRequestId.current.delete(clientRequestId);
        streamSeqByClientRequestId.current.delete(clientRequestId);
        if (streamMessageByClientRequestId.current.size === 0) {
          dispatch(setChatStatus('idle'));
        }
        return;
      }

      if (event.type === 'error') {
        streamMessageByClientRequestId.current.delete(clientRequestId);
        streamSeqByClientRequestId.current.delete(clientRequestId);
        const message = event.error?.message || 'Streaming chat request failed.';
        dispatch(setChatStatus('error'));
        dispatch(setChatError(message));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  const chatBindings = useMemo<AssessmentTabChatBindings>(
    () => ({
      activeCommand,
      pendingSelection,
      chatMode,
      isModeLockedToChat,
      draftText,
      onDraftChange: setDraftText,
      onSubmit: handleSubmit,
      onModeChange: handleModeChange,
      onCommandSelected: setActiveCommandWithModeRule
    }),
    [
      activeCommand,
      pendingSelection,
      chatMode,
      isModeLockedToChat,
      draftText,
      handleSubmit,
      handleModeChange,
      setActiveCommandWithModeRule
    ]
  );

  useEffect(() => {
    if (!onChatBindingsChange) {
      return;
    }
    onChatBindingsChange(chatBindings);
  }, [chatBindings, onChatBindingsChange]);

  const setSplitRatio = (ratio: number) => {
    dispatch({ type: 'ui/setAssessmentSplitRatio', payload: ratio });
  };

  const handleSelectComment = useCallback(
    (commentId: string) => {
      setActiveCommentId(commentId);
      const selectedComment = comments.find((comment) => comment.id === commentId);
      if (!selectedComment || selectedComment.kind !== 'inline') {
        setPendingSelection(null);
        return;
      }
      setPendingSelection({
        exactQuote: selectedComment.exactQuote,
        prefixText: selectedComment.prefixText,
        suffixText: selectedComment.suffixText,
        startAnchor: selectedComment.startAnchor,
        endAnchor: selectedComment.endAnchor
      });
    },
    [comments]
  );

  const handleEditComment = useCallback(
    async (commentId: string, nextText: string) => {
      try {
        await editFeedback({ feedbackId: commentId, commentText: nextText });
        await feedbackListQuery.refetch();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to edit comment.';
        toast.error(message);
      }
    },
    [feedbackListQuery]
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      try {
        await deleteFeedback({ feedbackId: commentId });
        setActiveCommentId((current) => (current === commentId ? null : current));
        await feedbackListQuery.refetch();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to delete comment.';
        toast.error(message);
      }
    },
    [feedbackListQuery]
  );

  const handleApplyComment = useCallback(
    async (commentId: string, applied: boolean) => {
      try {
        await applyFeedback({ feedbackId: commentId, applied });
        await feedbackListQuery.refetch();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update apply state.';
        toast.error(message);
      }
    },
    [feedbackListQuery]
  );

  const handleSendToLlm = useCallback(
    async (commentId: string, commandId?: string) => {
      try {
        setActiveCommentId(commentId);
        setActiveCommandWithModeRule({
          id: commandId ?? 'send-feedback-to-llm',
          label: commandId ? commandId.replace(/[-_]/g, ' ') : 'Send Feedback To LLM',
          source: 'chat-dropdown'
        });
        await sendFeedbackToLlm({ feedbackId: commentId, command: commandId });
        await feedbackListQuery.refetch();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to send comment to LLM.';
        toast.error(message);
      }
    },
    [feedbackListQuery, setActiveCommandWithModeRule]
  );

  const handleGenerateFeedbackDocument = useCallback(async () => {
    if (!canGenerateFeedbackDocument) {
      return;
    }

    try {
      const result = await generateFeedbackDocumentForFile();
      toast.success(`Generated feedback document: ${result.outputPath}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : generateFeedbackErrorMessage ?? 'Unable to generate feedback document.';
      toast.error(message);
    }
  }, [canGenerateFeedbackDocument, generateFeedbackDocumentForFile, generateFeedbackErrorMessage]);

  const updateRatioFromClientX = (clientX: number) => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const bounds = container.getBoundingClientRect();
    if (bounds.width <= 0) {
      return;
    }
    const ratio = (clientX - bounds.left) / bounds.width;
    setSplitRatio(ratio);
  };

  const onSplitterPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();

    const onPointerMove = (moveEvent: PointerEvent) => {
      updateRatioFromClientX(moveEvent.clientX);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const onSplitterKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setSplitRatio(assessmentSplitRatio - 0.02);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setSplitRatio(assessmentSplitRatio + 0.02);
    }
  };

  return (
    <div
      ref={containerRef}
      className="assessment-tab workspace assessment"
      data-testid="assessment-tab"
      data-mode={mode}
      style={
        {
          '--assessment-left-ratio': String(assessmentSplitRatio)
        } as React.CSSProperties
      }
    >
      <div data-testid="assessment-orchestrator-state" hidden>
        {`mode:${chatMode};locked:${String(isModeLockedToChat)}`}
      </div>
      {isImageViewOpen ? <ImageView /> : null}
      <OriginalTextView
        selectedFileId={selectedFileId}
        text={originalText}
        pendingSelection={pendingSelection}
        activeCommentId={activeCommentId}
        onSelectionCaptured={setPendingSelection}
      />
      {!isImageViewOpen ? (
        <div
          className="assessment-splitter"
          data-testid="assessment-splitter"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize assessment panes"
          tabIndex={0}
          onPointerDown={onSplitterPointerDown}
          onKeyDown={onSplitterKeyDown}
        />
      ) : null}
      <CommentsView
        comments={comments}
        activeCommentId={activeCommentId}
        isLoading={state.feedback.status === 'loading' || isAddFeedbackPending}
        isGeneratePending={isGenerateFeedbackPending}
        canGenerateFeedbackDocument={canGenerateFeedbackDocument}
        error={
          state.feedback.status === 'error'
            ? state.feedback.error ?? addFeedbackErrorMessage ?? 'Unable to load comments.'
            : undefined
        }
        onSelectComment={handleSelectComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        onSendToLlm={handleSendToLlm}
        onApplyComment={handleApplyComment}
        onGenerateFeedbackDocument={handleGenerateFeedbackDocument}
        activeTab={activeCommentsTab}
        onTabChange={(tab) => dispatch({ type: 'ui/setCommentsTab', payload: tab })}
      />
    </div>
  );
}
