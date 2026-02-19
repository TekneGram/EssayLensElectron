import type { CommentViewProps } from '../../types';
import { CommentBody } from './CommentBody';
import { CommentHeader } from './CommentHeader';
import { CommentTools } from './CommentTools';

function createFallbackTitle(commentId: string, kind: 'inline' | 'block'): string {
  return `${kind === 'inline' ? 'Inline' : 'Block'} comment ${commentId.slice(0, 8)}`;
}

export function CommentView({
  comment,
  isActive,
  onApplyComment,
  onDeleteComment,
  onEditComment,
  onSelectComment,
  onSendToLlm
}: CommentViewProps) {
  const title = createFallbackTitle(comment.id, comment.kind);
  return (
    <article
      className={isActive ? 'comment-view is-active' : 'comment-view'}
      data-comment-id={comment.id}
      data-active={isActive ? 'true' : 'false'}
      onClick={() => onSelectComment(comment.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelectComment(comment.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Select ${title}`}
    >
      <CommentHeader comment={comment} title={title} isActive={isActive} />
      <CommentBody comment={comment} />
      <CommentTools
        commentId={comment.id}
        commentText={comment.commentText}
        applied={Boolean(comment.applied)}
        onApplyComment={onApplyComment}
        onDeleteComment={onDeleteComment}
        onEditComment={onEditComment}
        onSendToLlm={onSendToLlm}
      />
    </article>
  );
}
