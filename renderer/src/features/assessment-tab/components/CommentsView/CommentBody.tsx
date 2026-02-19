import type { CommentBodyProps } from '../../types';

function truncate(text: string, length: number): string {
  if (text.length <= length) {
    return text;
  }
  return `${text.slice(0, Math.max(0, length - 1)).trimEnd()}…`;
}

export function CommentBody({ comment, quotePreviewLength = 120 }: CommentBodyProps) {
  const preview = comment.kind === 'inline' ? truncate(comment.exactQuote, quotePreviewLength) : '';

  return (
    <section className="comment-body">
      {comment.kind === 'inline' ? (
        <p className="comment-quote-preview" title={comment.exactQuote}>
          <strong>Quote:</strong> {preview}
        </p>
      ) : null}
      <p className="comment-text">{comment.commentText}</p>
    </section>
  );
}
