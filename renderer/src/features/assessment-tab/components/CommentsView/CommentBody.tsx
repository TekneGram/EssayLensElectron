import type { CommentBodyProps } from '../../types';

export function CommentBody({ comment, quotePreviewLength = 120 }: CommentBodyProps) {
  const preview = comment.kind === 'inline' ? comment.exactQuote.slice(0, quotePreviewLength) : '';
  return (
    <section>
      {comment.kind === 'inline' ? <p>{preview}</p> : null}
      <p>{comment.commentText}</p>
    </section>
  );
}
