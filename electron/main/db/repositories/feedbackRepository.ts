export interface FeedbackRecord {
  id: string;
  fileId: string;
  kind: 'inline' | 'block';
  source: 'teacher' | 'llm';
  commentText: string;
  exactQuote?: string;
  prefixText?: string;
  suffixText?: string;
  startAnchor?: {
    part: string;
    paragraphIndex: number;
    runIndex: number;
    charOffset: number;
  };
  endAnchor?: {
    part: string;
    paragraphIndex: number;
    runIndex: number;
    charOffset: number;
  };
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
      commentText: ''
    };
  }
}
