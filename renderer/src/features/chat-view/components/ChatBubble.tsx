import ReactMarkdown from 'react-markdown';
import type { ChatViewMessageItem } from '../application/chatView.service';
import { toChatBubbleRoleLabel } from '../domain/chatBubble.domain';
import { useChatBubbleMarkdown } from '../hooks/useChatBubbleMarkdown';
import { useChatBubbleThinking } from '../hooks/useChatBubbleThinking';
import type { SessionSendPhase } from '../../chat-interface/domain/chatState.types';

interface ChatBubbleProps {
  item: ChatViewMessageItem;
  activeSessionSendPhase?: SessionSendPhase;
  showThinking: boolean;
  isLatestAssistant: boolean;
}

export function ChatBubble({ item, activeSessionSendPhase, showThinking, isLatestAssistant }: ChatBubbleProps) {
  const { components, remarkPlugins, rehypePlugins } = useChatBubbleMarkdown();
  const hasThinkingPhase = activeSessionSendPhase === 'warming' || activeSessionSendPhase === 'thinking';
  const isThinking = isLatestAssistant && (hasThinkingPhase || showThinking);
  const thinkingMessage = useChatBubbleThinking(activeSessionSendPhase, isThinking);

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
      {isThinking ? (
        <div className="chat-bubble-thinking chat-bubble-thinking--shimmer" data-testid="chat-bubble-thinking">
          {thinkingMessage}
        </div>
      ) : null}
    </li>
  );
}
