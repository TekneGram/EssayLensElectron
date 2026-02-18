export interface ChatRecord {
  id: string;
  role: 'system' | 'teacher' | 'assistant';
  content: string;
  relatedFileId?: string;
  createdAt: string;
}

export class ChatRepository {
  private messages: ChatRecord[] = [];

  async listMessages(fileId?: string): Promise<ChatRecord[]> {
    if (!fileId) {
      return [...this.messages];
    }
    return this.messages.filter((message) => message.relatedFileId === fileId);
  }

  async addMessage(message: ChatRecord): Promise<ChatRecord> {
    this.messages.push(message);
    return message;
  }
}
