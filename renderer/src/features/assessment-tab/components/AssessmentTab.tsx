import { useRef, useState } from 'react';
import { selectActiveCommentsTab, selectAssessmentSplitRatio, useAppDispatch, useAppState } from '../../../state';
import type { SelectedFileType } from '../../../state';
import type { ActiveCommand, ChatMode, PendingSelection } from '../types';
import { CommentsView } from './CommentsView';
import { ImageView } from './ImageView';
import { OriginalTextView } from './OriginalTextView';

interface AssessmentTabProps {
  selectedFileType: SelectedFileType;
}

export function AssessmentTab({ selectedFileType }: AssessmentTabProps) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const activeCommentsTab = selectActiveCommentsTab(state);
  const assessmentSplitRatio = selectAssessmentSplitRatio(state);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedFile = state.workspace.files.find((file) => file.id === state.workspace.selectedFile.fileId) ?? null;
  const selectedFileId = selectedFile?.id ?? null;
  const isImageViewOpen = selectedFileType === 'image';
  const mode = isImageViewOpen ? 'three-pane' : 'two-pane';
  const comments = selectedFileId ? state.feedback.byFileId[selectedFileId] ?? [] : [];
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);
  const [activeCommand, setActiveCommand] = useState<ActiveCommand | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>('comment');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [isProcessCenterOpen, setIsProcessCenterOpen] = useState(false);
  const originalText =
    selectedFileType === 'docx' || selectedFileType === 'pdf'
      ? `OriginalTextView: ${selectedFile?.name ?? 'No file selected.'}`
      : 'OriginalTextView';
  const isModeLockedToChat = activeCommand !== null;

  const setActiveCommandWithModeRule = (command: ActiveCommand | null) => {
    setActiveCommand(command);
    if (command) {
      setChatMode('chat');
      return;
    }
    if (isModeLockedToChat) {
      setChatMode('comment');
    }
  };

  const setSplitRatio = (ratio: number) => {
    dispatch({ type: 'ui/setAssessmentSplitRatio', payload: ratio });
  };

  const handleEditComment = (_commentId: string, _nextText: string) => {
    // Phase 0 stub: behavior added in later phases.
  };

  const handleDeleteComment = (_commentId: string) => {
    // Phase 0 stub: behavior added in later phases.
  };

  const handleApplyComment = (_commentId: string, _applied: boolean) => {
    // Phase 0 stub: behavior added in later phases.
  };

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
        isLoading={state.feedback.status === 'loading'}
        error={state.feedback.status === 'error' ? state.feedback.error ?? 'Unable to load comments.' : undefined}
        onSelectComment={setActiveCommentId}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        onSendToLlm={() => {
          setActiveCommandWithModeRule({
            id: 'send-feedback-to-llm',
            label: 'Send Feedback To LLM',
            source: 'chat-dropdown'
          });
        }}
        onApplyComment={handleApplyComment}
        activeTab={activeCommentsTab}
        onTabChange={(tab) => dispatch({ type: 'ui/setCommentsTab', payload: tab })}
      />
    </div>
  );
}
