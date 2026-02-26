import type { AppState } from '../../../state/types';

export function selectChatStatus(state: AppState) {
  return state.chat.status;
}

export function selectChatError(state: AppState) {
  return state.chat.error;
}
