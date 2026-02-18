import type { CommentKind, EntityId } from './primitives';

export interface SelectFolderCommand {
  path: string;
}

export interface SelectFileCommand {
  fileId: EntityId;
}

export interface AddFeedbackCommand {
  fileId: EntityId;
  kind: CommentKind;
  content: string;
  anchor?: {
    start: number;
    end: number;
  };
}

export interface RequestLlmAssessmentCommand {
  fileId: EntityId;
  instruction?: string;
}

export interface SendChatMessageCommand {
  fileId?: EntityId;
  content: string;
}
