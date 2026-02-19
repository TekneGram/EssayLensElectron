import type { CommentHeaderProps } from '../../types';

export function CommentHeader({ title, comment, isActive }: CommentHeaderProps) {
  return (
    <header>
      <strong>{title}</strong>
      <span>{isActive ? ' (active)' : ''}</span>
      <span>{` [${comment.source}]`}</span>
    </header>
  );
}
