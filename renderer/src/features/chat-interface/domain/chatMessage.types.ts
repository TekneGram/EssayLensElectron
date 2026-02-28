import type { ChatRole, EntityId, ISODateString } from '../../../types/primitives';

export interface ChatMessage {
  id: EntityId;
  role: ChatRole;
  content: string;
  relatedFileId?: EntityId;
  sessionId?: string;
  createdAt: ISODateString;
}

export type ChatDataArray = ChatMessage[];
