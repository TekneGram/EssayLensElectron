import type { ChatRole, CommentKind, EntityId, FileKind, ISODateString } from './primitives';
import type {
  BlockFeedbackDto,
  FeedbackAnchorDto,
  FeedbackDto,
  InlineFeedbackDto
} from '../../../electron/shared/assessmentContracts';

export interface WorkspaceFolder {
  id: EntityId;
  path: string;
  name: string;
  selectedAt?: ISODateString;
}

export interface WorkspaceFile {
  id: EntityId;
  folderId: EntityId;
  name: string;
  path: string;
  kind: FileKind;
  imagePath?: string;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

export interface SelectedFileState {
  fileId: EntityId | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error?: string;
}

export interface DocumentTextModel {
  fileId: EntityId;
  text: string;
  extractedAt?: ISODateString;
}

export interface ChatMessage {
  id: EntityId;
  role: ChatRole;
  content: string;
  relatedFileId?: EntityId;
  createdAt: ISODateString;
}

export type ChatDataArray = ChatMessage[];

export type FeedbackAnchor = FeedbackAnchorDto;
export type InlineFeedbackItem = InlineFeedbackDto;
export type BlockFeedbackItem = BlockFeedbackDto;
export type FeedbackItem = FeedbackDto;

export interface RubricSummary {
  id: EntityId;
  name: string;
  description?: string;
}

export interface RubricCategory {
  id: EntityId;
  name: string;
}

export interface RubricScoreLevel {
  id: EntityId;
  value: number;
}

export interface RubricCell {
  categoryId: EntityId;
  scoreId: EntityId;
  description: string;
}

export interface RubricMatrix {
  rubricId: EntityId;
  rubricName: string;
  categories: RubricCategory[];
  scores: RubricScoreLevel[];
  cells: RubricCell[];
}

export interface RubricGradingSelection {
  rubricId: EntityId;
  selectedCellKeys: string[];
}
