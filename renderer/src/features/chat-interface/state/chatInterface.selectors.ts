import type { AppState } from '../../../state';

export function selectChatDraft(state: AppState) {
  return state.chat.draft;
}

export function selectChatStatus(state: AppState) {
  return state.chat.status;
}

export function selectChatError(state: AppState) {
  return state.chat.error;
}

