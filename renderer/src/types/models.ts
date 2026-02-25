import type { ChatRole, EntityId, ISODateString } from './primitives';
import type {
  BlockFeedbackDto,
  FeedbackAnchorDto,
  FeedbackDto,
  InlineFeedbackDto
} from '../../../electron/shared/assessmentContracts';

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
  isActive: boolean;
  isArchived: boolean;
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
