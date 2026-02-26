import { useAppState } from '../../../state';
import { selectChatMessages, selectIsChatCollapsed } from '../state';

export function useChatViewState() {
  const state = useAppState();
  return {
    isCollapsed: selectIsChatCollapsed(state),
    messages: selectChatMessages(state)
  };
}

