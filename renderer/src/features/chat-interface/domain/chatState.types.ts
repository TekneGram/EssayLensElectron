import type { ChatDataArray } from './chatMessage.types';

export interface ChatState {
  messages: ChatDataArray;
  status: 'idle' | 'sending' | 'error';
  error?: string;
}
