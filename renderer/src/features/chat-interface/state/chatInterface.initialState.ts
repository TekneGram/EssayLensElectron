import type { ChatState } from '../domain';

export const initialChatState: ChatState = {
  messages: [],
  status: 'idle'
};
