import { useEffect, useState } from 'react';
import type { CommentToolsProps } from '../../types';

const SEND_TO_LLM_COMMANDS = [
  { id: '', label: 'Default' },
  { id: 'evaluate-thesis', label: 'Evaluate Thesis' },
  { id: 'check-hedging', label: 'Check Hedging' }
] as const;

export function CommentTools({
  commentId,
  commentText,
  applied,
  onApplyComment,
  onDeleteComment,
  onEditComment,
  onSendToLlm
}: CommentToolsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(commentText);
  const [commandId, setCommandId] = useState<string>('');

  const trimmedDraft = draftText.trim();
  const canSave = trimmedDraft.length > 0 && trimmedDraft !== commentText;

  useEffect(() => {
    setDraftText(commentText);
  }, [commentText]);

  return (
    <div className="comment-tools" onClick={(event) => event.stopPropagation()}>
      {isEditing ? (
        <div className="comment-edit-controls">
          <textarea
            className="comment-edit-input"
            aria-label="Edit comment text"
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
          />
          <div className="comment-edit-buttons">
            <button
              type="button"
              onClick={() => {
                if (!canSave) {
                  return;
                }
                onEditComment(commentId, trimmedDraft);
                setIsEditing(false);
              }}
              disabled={!canSave}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftText(commentText);
                setIsEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setIsEditing(true)}>
          Edit
        </button>
      )}
      <button type="button" onClick={() => onDeleteComment(commentId)}>
        Delete
      </button>
      <div className="comment-llm-controls">
        <select aria-label="Send command" value={commandId} onChange={(event) => setCommandId(event.target.value)}>
          {SEND_TO_LLM_COMMANDS.map((command) => (
            <option key={command.id || 'default'} value={command.id}>
              {command.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => onSendToLlm(commentId, commandId || undefined)}>
          Send to LLM
        </button>
      </div>
      <button type="button" onClick={() => onApplyComment(commentId, !applied)}>
        {applied ? 'Unapply' : 'Apply'}
      </button>
    </div>
  );
}
