import type { ChatState } from '../domain';

export const initialChatState: ChatState = {
  messages: [],
  draft: '',
  status: 'idle'
};

