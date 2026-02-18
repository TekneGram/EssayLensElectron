export interface FeedbackRecord {
  id: string;
  fileId: string;
  kind: 'inline' | 'block';
  source: 'teacher' | 'llm';
  content: string;
}

export class FeedbackRepository {
  async listByFileId(_fileId: string): Promise<FeedbackRecord[]> {
    return [];
  }

  async add(_feedback: FeedbackRecord): Promise<FeedbackRecord> {
    return {
      id: 'phase2-feedback-placeholder',
      fileId: '',
      kind: 'block',
      source: 'teacher',
      content: ''
    };
  }
}
