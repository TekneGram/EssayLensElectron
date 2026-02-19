import type { CommentsTab } from '../../../../state';
import type { CommentsViewProps } from '../../types';
import { CommentView } from './CommentView';

interface AssessmentCommentsViewProps extends CommentsViewProps {
  activeTab: CommentsTab;
  onTabChange: (tab: CommentsTab) => void;
}

export function CommentsView({
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
}: AssessmentCommentsViewProps) {
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
