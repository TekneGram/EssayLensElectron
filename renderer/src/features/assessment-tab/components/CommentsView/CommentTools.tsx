import type { CommentToolsProps } from '../../types';

export function CommentTools({ commentId, applied, onApplyComment, onDeleteComment, onEditComment, onSendToLlm }: CommentToolsProps) {
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
