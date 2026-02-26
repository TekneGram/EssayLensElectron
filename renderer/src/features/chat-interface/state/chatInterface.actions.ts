import type { ChatMessage, ChatState } from '../domain';

type SetMessagesAction = { type: 'chat/setMessages'; payload: ChatMessage[] };
type AddMessageAction = { type: 'chat/addMessage'; payload: ChatMessage };
type UpdateMessageContentAction = {
  type: 'chat/updateMessageContent';
  payload: { messageId: string; content: string; mode: 'append' | 'replace' };
};
type SetStatusAction = { type: 'chat/setStatus'; payload: ChatState['status'] };
type SetErrorAction = { type: 'chat/setError'; payload?: string };

export function setChatMessages(payload: ChatMessage[]): SetMessagesAction {
  return { type: 'chat/setMessages', payload };
}

export function addChatMessage(payload: ChatMessage): AddMessageAction {
  return { type: 'chat/addMessage', payload };
}

export function updateChatMessageContent(payload: UpdateMessageContentAction['payload']): UpdateMessageContentAction {
  return { type: 'chat/updateMessageContent', payload };
}

export function setChatStatus(payload: ChatState['status']): SetStatusAction {
  return { type: 'chat/setStatus', payload };
}

export function setChatError(payload?: string): SetErrorAction {
  return { type: 'chat/setError', payload };
}

export type ChatInterfaceAction =
  | SetMessagesAction
  | AddMessageAction
  | UpdateMessageContentAction
  | SetStatusAction
  | SetErrorAction;
