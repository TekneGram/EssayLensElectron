import type { CommentViewProps } from '../../types';
import { CommentBody } from './CommentBody';
import { CommentHeader } from './CommentHeader';
import { CommentTools } from './CommentTools';

export function CommentView({
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
