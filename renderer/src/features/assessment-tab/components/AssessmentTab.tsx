import { useRef, useState } from 'react';
import { selectActiveCommentsTab, selectAssessmentSplitRatio, useAppDispatch, useAppState } from '../../../state';
import type { CommentsTab, SelectedFileType } from '../../../state';
import type {
  ActiveCommand,
  ChatMode,
  CommentBodyProps,
  CommentHeaderProps,
  CommentToolsProps,
  CommentsViewProps,
  CommentViewProps,
  OriginalTextViewProps,
  PendingSelection
} from '../types';

interface AssessmentTabProps {
  selectedFileType: SelectedFileType;
}

function ImageView() {
  return (
    <section className="image-view subpane" data-testid="image-view">
      <h4>ImageView</h4>
      <div className="content-block">Image preview area.</div>
    </section>
  );
}

function OriginalTextView({
  text,
  pendingSelection,
  isProcessCenterOpen,
  onSelectionCaptured,
  onCommandSelected,
  onToggleProcessCenter
}: OriginalTextViewProps) {
  return (
    <section className="original-text-view subpane" data-testid="original-text-view">
      <h4>OriginalTextView</h4>
      <button type="button" onClick={() => onToggleProcessCenter(!isProcessCenterOpen)}>
        {isProcessCenterOpen ? 'Hide Process Center' : 'Show Process Center'}
      </button>
      <button type="button" onClick={() => onSelectionCaptured(null)}>
        Clear Selection
      </button>
      <button
        type="button"
        onClick={() =>
          onCommandSelected({
            id: 'evaluate-thesis',
            label: 'Evaluate Thesis',
            source: 'process-center'
          })
        }
      >
        Select Command
      </button>
      {pendingSelection ? <div className="content-block">Pending quote: {pendingSelection.exactQuote}</div> : null}
      <div className="content-block">{text}</div>
    </section>
  );
}

function CommentHeader({ title, comment, isActive }: CommentHeaderProps) {
  return (
    <header>
      <strong>{title}</strong>
      <span>{isActive ? ' (active)' : ''}</span>
      <span>{` [${comment.source}]`}</span>
    </header>
  );
}

function CommentBody({ comment, quotePreviewLength = 120 }: CommentBodyProps) {
  const preview = comment.kind === 'inline' ? comment.exactQuote.slice(0, quotePreviewLength) : '';
  return (
    <section>
      {comment.kind === 'inline' ? <p>{preview}</p> : null}
      <p>{comment.commentText}</p>
    </section>
  );
}

function CommentTools({ commentId, applied, onApplyComment, onDeleteComment, onEditComment, onSendToLlm }: CommentToolsProps) {
  return (
    <div>
      <button type="button" onClick={() => onEditComment(commentId, 'Placeholder edit')}>
        Edit
      </button>
      <button type="button" onClick={() => onDeleteComment(commentId)}>
        Delete
      </button>
      <button type="button" onClick={() => onSendToLlm(commentId)}>
        Send to LLM
      </button>
      <button type="button" onClick={() => onApplyComment(commentId, !applied)}>
        {applied ? 'Unapply' : 'Apply'}
      </button>
    </div>
  );
}

function CommentView({
  comment,
  isActive,
  onApplyComment,
  onDeleteComment,
  onEditComment,
  onSelectComment,
  onSendToLlm
}: CommentViewProps) {
  const title = `Comment ${comment.id.slice(0, 8)}`;
  return (
    <article>
      <button type="button" onClick={() => onSelectComment(comment.id)}>
        Select
      </button>
      <CommentHeader comment={comment} title={title} isActive={isActive} />
      <CommentBody comment={comment} />
      <CommentTools
        commentId={comment.id}
        applied={Boolean(comment.applied)}
        onApplyComment={onApplyComment}
        onDeleteComment={onDeleteComment}
        onEditComment={onEditComment}
        onSendToLlm={onSendToLlm}
      />
    </article>
  );
}

function CommentsView({
  comments,
  activeCommentId,
  error,
  isLoading,
  onApplyComment,
  onDeleteComment,
  onEditComment,
  onSelectComment,
  onSendToLlm,
  activeTab,
  onTabChange
}: CommentsViewProps & { activeTab: CommentsTab; onTabChange: (tab: CommentsTab) => void }) {
  return (
    <section className="comments-view subpane">
      <h4>CommentsView</h4>
      <div role="tablist" aria-label="Comments tabs" className="comments-tabs tabs">
        <button
          type="button"
          className={activeTab === 'comments' ? 'tab active is-active' : 'tab'}
          role="tab"
          aria-selected={activeTab === 'comments'}
          onClick={() => onTabChange('comments')}
        >
          Comments
        </button>
        <button
          type="button"
          className={activeTab === 'score' ? 'tab active is-active' : 'tab'}
          role="tab"
          aria-selected={activeTab === 'score'}
          onClick={() => onTabChange('score')}
        >
          Score
        </button>
      </div>
      <div className="comments-content">
        <div className="content-block comments-panel" role="tabpanel" hidden={activeTab !== 'comments'}>
          {isLoading ? <div>Loading comments...</div> : null}
          {error ? <div>{error}</div> : null}
          {!isLoading && !error && comments.length === 0 ? <div>No comments yet.</div> : null}
          {comments.map((comment) => (
            <CommentView
              key={comment.id}
              comment={comment}
              isActive={activeCommentId === comment.id}
              onApplyComment={onApplyComment}
              onDeleteComment={onDeleteComment}
              onEditComment={onEditComment}
              onSelectComment={onSelectComment}
              onSendToLlm={onSendToLlm}
            />
          ))}
        </div>
        <div className="content-block comments-panel" role="tabpanel" hidden={activeTab !== 'score'}>
          ScoreTool
        </div>
      </div>
    </section>
  );
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
