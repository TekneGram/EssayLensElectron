import type { AppAction, ChatMessage, ChatState } from '../../../state';

type AddMessageAction = Extract<AppAction, { type: 'chat/addMessage' }>;
type UpdateMessageContentAction = Extract<AppAction, { type: 'chat/updateMessageContent' }>;
type SetDraftAction = Extract<AppAction, { type: 'chat/setDraft' }>;
type SetStatusAction = Extract<AppAction, { type: 'chat/setStatus' }>;
type SetErrorAction = Extract<AppAction, { type: 'chat/setError' }>;

export function addChatMessage(payload: ChatMessage): AddMessageAction {
  return { type: 'chat/addMessage', payload };
}

export function updateChatMessageContent(payload: UpdateMessageContentAction['payload']): UpdateMessageContentAction {
  return { type: 'chat/updateMessageContent', payload };
}

export function setChatDraft(payload: string): SetDraftAction {
  return { type: 'chat/setDraft', payload };
}

export function setChatStatus(payload: ChatState['status']): SetStatusAction {
  return { type: 'chat/setStatus', payload };
}

export function setChatError(payload?: string): SetErrorAction {
  return { type: 'chat/setError', payload };
}

export type ChatInterfaceAction =
  | AddMessageAction
  | UpdateMessageContentAction
  | SetDraftAction
  | SetStatusAction
  | SetErrorAction;

