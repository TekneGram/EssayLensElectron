import { useMemo } from 'react';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import type { PluggableList } from 'unified';
import { chatBubbleMarkdownComponents, chatBubbleSanitizeSchema } from '../application/chatBubbleMarkdown.service';

export function useChatBubbleMarkdown() {
  return useMemo(
    () => ({
      components: chatBubbleMarkdownComponents,
      remarkPlugins: [remarkGfm] as PluggableList,
      rehypePlugins: [[rehypeSanitize, chatBubbleSanitizeSchema]] as PluggableList
    }),
    []
  );
}
