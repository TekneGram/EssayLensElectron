import type { ActiveCommand, ChatMode, PendingSelection } from '../../chat-interface/domain';
import type { FeedbackItem } from '../../feedback/domain';

export interface AssessmentTabLocalState {
  pendingSelection: PendingSelection | null;
  activeCommand: ActiveCommand | null;
  chatMode: ChatMode;
  activeCommentId: string | null;
  draftText: string;
  feedbackByFileId: Record<string, FeedbackItem[]>;
  feedbackStatus: 'idle' | 'loading' | 'error';
  feedbackError?: string;
}
