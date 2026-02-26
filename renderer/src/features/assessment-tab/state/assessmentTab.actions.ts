import type { ActiveCommand, ChatMode, PendingSelection } from '../../chat-interface/domain';
import type { FeedbackItem } from '../../feedback/domain';

export type AssessmentTabAction =
  | { type: 'assessmentTab/setPendingSelection'; payload: PendingSelection | null }
  | { type: 'assessmentTab/setActiveCommand'; payload: ActiveCommand | null }
  | { type: 'assessmentTab/clearActiveCommentIfMatch'; payload: string }
  | { type: 'assessmentTab/setChatMode'; payload: ChatMode }
  | { type: 'assessmentTab/setActiveCommentId'; payload: string | null }
  | { type: 'assessmentTab/setDraftText'; payload: string }
  | { type: 'assessmentTab/setFeedbackForFile'; payload: { fileId: string; items: FeedbackItem[] } }
  | { type: 'assessmentTab/addFeedback'; payload: FeedbackItem }
  | { type: 'assessmentTab/setFeedbackStatus'; payload: 'idle' | 'loading' | 'error' }
  | { type: 'assessmentTab/setFeedbackError'; payload?: string };
