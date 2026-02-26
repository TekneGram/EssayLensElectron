import type { ChatMessage } from '../../chat-interface/domain';

export interface ChatViewMessageItem {
  id: string;
  roleClassName: string;
  text: string;
}

export function toChatViewMessageItems(messages: ChatMessage[]): ChatViewMessageItem[] {
  return messages.map((message) => ({
    id: message.id,
    roleClassName: message.role,
    text: `[${message.role}] ${message.content}`
  }));
}
