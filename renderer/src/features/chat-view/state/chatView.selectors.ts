import type { AppState } from '../../../state/types';

export function selectChatMessages(state: AppState) {
  return state.chat.messages;
}

export function selectIsChatCollapsed(state: AppState) {
  return state.ui.isChatCollapsed;
}
