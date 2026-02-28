import type { Components } from 'react-markdown';
import { defaultSchema } from 'rehype-sanitize';
import type { Options } from 'rehype-sanitize';
import { CHAT_BUBBLE_LINK_REL, CHAT_BUBBLE_LINK_TARGET } from '../state/chatBubble.state';

const codeAttributes = defaultSchema.attributes?.code ?? [];

export const chatBubbleSanitizeSchema: Options = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...codeAttributes, ['className', /^language-[a-z0-9-]+$/i]]
  }
};

export const chatBubbleMarkdownComponents: Components = {
  a: ({ node: _node, ...props }) => <a target={CHAT_BUBBLE_LINK_TARGET} rel={CHAT_BUBBLE_LINK_REL} {...props} />,
  pre: ({ node: _node, ...props }) => <pre className="chat-bubble-code-block" {...props} />,
  code: ({ className, children, ...props }) => {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }
};
