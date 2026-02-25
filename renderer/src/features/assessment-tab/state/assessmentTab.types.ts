import type { ActiveCommand, ChatMode, PendingSelection } from '../../chat-interface/domain';

export interface AssessmentTabLocalState {
  pendingSelection: PendingSelection | null;
  activeCommand: ActiveCommand | null;
  chatMode: ChatMode;
  activeCommentId: string | null;
  draftText: string;
}
