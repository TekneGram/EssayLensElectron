import type { EntityId } from './primitives';
import type {
  AddBlockFeedbackRequest,
  AddFeedbackRequest,
  AddInlineFeedbackRequest,
  RequestLlmAssessmentRequest
} from '../../../electron/shared/assessmentContracts';

export interface SelectFolderCommand {
  path: string;
}

export interface SelectFileCommand {
  fileId: EntityId;
}

export type AddInlineFeedbackCommand = AddInlineFeedbackRequest;
export type AddBlockFeedbackCommand = AddBlockFeedbackRequest;
export type AddFeedbackCommand = AddFeedbackRequest;
export type RequestLlmAssessmentCommand = RequestLlmAssessmentRequest;

export interface SendChatMessageCommand {
  fileId?: EntityId;
  content: string;
}
