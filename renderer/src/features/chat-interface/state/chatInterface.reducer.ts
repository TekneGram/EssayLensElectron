import type { AppAction } from '../../../state/actions';
import type { ChatState } from '../domain';
import { initialChatState } from './chatInterface.initialState';

export function chatReducer(state: ChatState = initialChatState, action: AppAction): ChatState {
  switch (action.type) {
    case 'chat/setMessages':
      return {
        ...state,
        messages: action.payload
      };
    case 'chat/addMessage':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    case 'chat/updateMessageContent':
      return {
        ...state,
        messages: state.messages.map((message) => {
          if (message.id !== action.payload.messageId) {
            return message;
          }
          return {
            ...message,
            content:
              action.payload.mode === 'append'
                ? `${message.content}${action.payload.content}`
                : action.payload.content
          };
        })
      };
    case 'chat/setDraft':
      return {
        ...state,
        draft: action.payload
      };
    case 'chat/setStatus':
      return {
        ...state,
        status: action.payload
      };
    case 'chat/setError':
      return {
        ...state,
        error: action.payload
      };
    default:
      return state;
  }
}

