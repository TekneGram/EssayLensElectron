import type { EntityId } from './primitives';
import type { FeedbackAnchor } from './models';

export interface SelectFolderCommand {
  path: string;
}

export interface SelectFileCommand {
  fileId: EntityId;
}

interface AddFeedbackCommandBase {
  fileId: EntityId;
  source: 'teacher' | 'llm';
  commentText: string;
}

export interface AddInlineFeedbackCommand extends AddFeedbackCommandBase {
  kind: 'inline';
  exactQuote: string;
  prefixText: string;
  suffixText: string;
  startAnchor: FeedbackAnchor;
  endAnchor: FeedbackAnchor;
}

export interface AddBlockFeedbackCommand extends AddFeedbackCommandBase {
  kind: 'block';
}

export type AddFeedbackCommand = AddInlineFeedbackCommand | AddBlockFeedbackCommand;

export interface RequestLlmAssessmentCommand {
  fileId: EntityId;
  instruction?: string;
}

export interface SendChatMessageCommand {
  fileId?: EntityId;
  content: string;
}
