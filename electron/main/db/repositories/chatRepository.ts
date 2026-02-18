export interface ChatRecord {
  id: string;
  role: 'system' | 'teacher' | 'assistant';
  content: string;
}

export class ChatRepository {
  async listMessages(_fileId?: string): Promise<ChatRecord[]> {
    return [];
  }

  async addMessage(message: ChatRecord): Promise<ChatRecord> {
    return message;
  }
}
