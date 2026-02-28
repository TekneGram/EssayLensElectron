import type { ChatViewMessageItem } from './chatView.service';

export function toLatestAssistantIndex(items: ChatViewMessageItem[]): number | undefined {
  return [...items]
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.roleClassName === 'assistant')
    .map(({ index }) => index)
    .pop();
}

export function toStreamRenderKey(items: ChatViewMessageItem[]): string {
  return items.map((item) => `${item.id}:${item.text.length}`).join('|');
}
