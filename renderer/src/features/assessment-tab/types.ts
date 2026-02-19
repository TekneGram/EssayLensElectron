import type { FeedbackAnchor, FeedbackItem } from '../../types';
import type { EntityId } from '../../types/primitives';

export type ChatMode = 'comment' | 'chat';
export type CommandId = string;

export interface PendingSelection {
  exactQuote: string;
  prefixText: string;
  suffixText: string;
  startAnchor: FeedbackAnchor;
  endAnchor: FeedbackAnchor;
}

export interface ActiveCommand {
  id: CommandId;
  label: string;
  source: 'process-center' | 'chat-dropdown';
}

export interface OriginalTextViewProps {
  selectedFileId: EntityId | null;
  text: string;
  pendingSelection: PendingSelection | null;
  activeCommentId: string | null;
  isProcessCenterOpen: boolean;
  onSelectionCaptured: (selection: PendingSelection | null) => void;
  onCommandSelected: (command: ActiveCommand) => void;
  onToggleProcessCenter: (open: boolean) => void;
}

export interface CommentsViewProps {
  comments: FeedbackItem[];
  activeCommentId: string | null;
  isLoading: boolean;
  isGeneratePending: boolean;
  canGenerateFeedbackDocument: boolean;
  error?: string;
  onSelectComment: (commentId: string) => void;
  onEditComment: (commentId: string, nextText: string) => void;
  onDeleteComment: (commentId: string) => void;
  onSendToLlm: (commentId: string, command?: CommandId) => void;
  onApplyComment: (commentId: string, applied: boolean) => void;
  onGenerateFeedbackDocument: () => void;
}

export interface CommentViewProps {
  comment: FeedbackItem;
  isActive: boolean;
  onSelectComment: (commentId: string) => void;
  onEditComment: (commentId: string, nextText: string) => void;
  onDeleteComment: (commentId: string) => void;
  onSendToLlm: (commentId: string, command?: CommandId) => void;
  onApplyComment: (commentId: string, applied: boolean) => void;
}

export interface CommentHeaderProps {
  comment: FeedbackItem;
  title: string;
  isActive: boolean;
}

export interface CommentBodyProps {
  comment: FeedbackItem;
  quotePreviewLength?: number;
}

export interface CommentToolsProps {
  commentId: string;
  commentText: string;
  applied: boolean;
  onEditComment: (commentId: string, nextText: string) => void;
  onDeleteComment: (commentId: string) => void;
  onSendToLlm: (commentId: string, command?: CommandId) => void;
  onApplyComment: (commentId: string, applied: boolean) => void;
}

export interface ChatInterfaceProps {
  activeCommand: ActiveCommand | null;
  pendingSelection: PendingSelection | null;
  chatMode: ChatMode;
  isModeLockedToChat: boolean;
  draftText: string;
  onDraftChange: (text: string) => void;
  onSubmit: () => void;
  onModeChange: (mode: ChatMode) => void;
  onCommandSelected: (command: ActiveCommand | null) => void;
}

export type AssessmentTabChatBindings = ChatInterfaceProps;
