import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { selectActiveCommentsTab, selectAssessmentSplitRatio, useAppDispatch, useAppState } from '../../../state';
import type { SelectedFileType } from '../../../state';
import type { FeedbackItem } from '../../../types';
import { useAddFeedbackMutation, useFeedbackListQuery } from '../hooks';
import type { ActiveCommand, AssessmentTabChatBindings, ChatMode, PendingSelection } from '../types';
import { CommentsView } from './CommentsView';
import { ImageView } from './ImageView';
import { OriginalTextView } from './OriginalTextView';

interface AssessmentTabProps {
  selectedFileType: SelectedFileType;
  onChatBindingsChange?: (bindings: AssessmentTabChatBindings) => void;
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
  useFeedbackListQuery(selectedFileId);
  const addFeedbackMutation = useAddFeedbackMutation(selectedFileId);
  const comments = selectedFileId ? state.feedback.byFileId[selectedFileId] ?? [] : [];
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);
  const [activeCommand, setActiveCommand] = useState<ActiveCommand | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>('comment');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [isProcessCenterOpen, setIsProcessCenterOpen] = useState(false);
  const [draftText, setDraftText] = useState('');
  const originalText =
    selectedFileType === 'docx' || selectedFileType === 'pdf'
      ? `OriginalTextView: ${selectedFile?.name ?? 'No file selected.'}`
      : 'OriginalTextView';
  const isModeLockedToChat = activeCommand !== null;

  const setActiveCommandWithModeRule = useCallback((command: ActiveCommand | null) => {
    setActiveCommand(command);
    setChatMode((currentMode) => {
      if (command) {
        return 'chat';
      }
      return currentMode === 'chat' ? 'comment' : currentMode;
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

  const handleSubmit = useCallback(() => {
    if (!draftText.trim()) {
      return;
    }
    setDraftText('');
  }, [draftText]);

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

  const updateCurrentFileComments = useCallback(
    (updater: (currentComments: FeedbackItem[]) => FeedbackItem[]) => {
      if (!selectedFileId) {
        return;
      }
      const currentComments = state.feedback.byFileId[selectedFileId] ?? [];
      dispatch({
        type: 'feedback/setForFile',
        payload: {
          fileId: selectedFileId,
          items: updater(currentComments)
        }
      });
    },
    [dispatch, selectedFileId, state.feedback.byFileId]
  );

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
    (commentId: string, nextText: string) => {
      const updatedAt = new Date().toISOString();
      updateCurrentFileComments((currentComments) =>
        currentComments.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                commentText: nextText,
                updatedAt
              }
            : comment
        )
      );
    },
    [updateCurrentFileComments]
  );

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      setActiveCommentId((current) => (current === commentId ? null : current));
      updateCurrentFileComments((currentComments) => currentComments.filter((comment) => comment.id !== commentId));
    },
    [updateCurrentFileComments]
  );

  const handleApplyComment = useCallback(
    (commentId: string, applied: boolean) => {
      updateCurrentFileComments((currentComments) =>
        currentComments.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                applied
              }
            : comment
        )
      );
    },
    [updateCurrentFileComments]
  );

  const handleSendToLlm = useCallback(
    (commentId: string, commandId?: string) => {
      setActiveCommentId(commentId);
      setActiveCommandWithModeRule({
        id: commandId ?? 'send-feedback-to-llm',
        label: commandId ? commandId.replace(/[-_]/g, ' ') : 'Send Feedback To LLM',
        source: 'chat-dropdown'
      });
    },
    [setActiveCommandWithModeRule]
  );

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
        isProcessCenterOpen={isProcessCenterOpen}
        onSelectionCaptured={setPendingSelection}
        onCommandSelected={setActiveCommandWithModeRule}
        onToggleProcessCenter={setIsProcessCenterOpen}
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
        isLoading={state.feedback.status === 'loading' || addFeedbackMutation.isPending}
        error={
          state.feedback.status === 'error'
            ? state.feedback.error ?? addFeedbackMutation.errorMessage ?? 'Unable to load comments.'
            : undefined
        }
        onSelectComment={handleSelectComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        onSendToLlm={handleSendToLlm}
        onApplyComment={handleApplyComment}
        activeTab={activeCommentsTab}
        onTabChange={(tab) => dispatch({ type: 'ui/setCommentsTab', payload: tab })}
      />
    </div>
  );
}
