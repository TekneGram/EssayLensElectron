import type { ChatDataArray } from '../../../types/models';

export interface ChatState {
  messages: ChatDataArray;
  draft: string;
  status: 'idle' | 'sending' | 'error';
  error?: string;
}

