import ReactMarkdown from 'react-markdown';
import type { ChatViewMessageItem } from '../application/chatView.service';
import { toChatBubbleRoleLabel } from '../domain/chatBubble.domain';
import { useChatBubbleMarkdown } from '../hooks/useChatBubbleMarkdown';

interface ChatBubbleProps {
  item: ChatViewMessageItem;
  showThinking: boolean;
  isLatestAssistant: boolean;
}

export function ChatBubble({ item, showThinking, isLatestAssistant }: ChatBubbleProps) {
  const { components, remarkPlugins, rehypePlugins } = useChatBubbleMarkdown();

  return (
    <li className={`msg ${item.roleClassName}`} data-testid={`chat-bubble-${item.id}`}>
      <div className="chat-bubble-role">{toChatBubbleRoleLabel(item.roleClassName)}</div>
      <div className="chat-bubble-content">
        <ReactMarkdown
          components={components}
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
        >
          {item.text}
        </ReactMarkdown>
      </div>
      {showThinking && isLatestAssistant ? <div className="chat-bubble-thinking">-----thinking-----</div> : null}
    </li>
  );
}
