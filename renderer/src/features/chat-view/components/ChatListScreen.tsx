import type { LlmSessionListItemDto } from '../../../../../electron/shared/llm-session';

interface ChatListScreenProps {
  sessions: LlmSessionListItemDto[];
  activeSessionId?: string;
  isLoading: boolean;
  error?: string;
  onSessionSelect: (sessionId: string) => void;
}

function toReadableDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString();
}

export function ChatListScreen({ sessions, activeSessionId, isLoading, error, onSessionSelect }: ChatListScreenProps) {
  if (isLoading) {
    return <p className="content-block">Loading chat sessions...</p>;
  }

  if (error) {
    return <p className="content-block">{error}</p>;
  }

  if (sessions.length === 0) {
    return <p className="content-block">No chats yet for this file. Start a new chat to begin.</p>;
  }

  return (
    <ul className="chat-log" data-testid="chat-list-screen">
      {sessions.map((session) => (
        <li key={session.sessionId}>
          <button
            type="button"
            className={`msg chat-session-item ${session.sessionId === activeSessionId ? 'assistant' : 'system'}`}
            aria-label={`Open chat session ${session.sessionId}`}
            onClick={() => onSessionSelect(session.sessionId)}
          >
            <strong>{session.sessionId}</strong>
            <br />
            Last used: {toReadableDate(session.lastUsedAt)}
          </button>
        </li>
      ))}
    </ul>
  );
}
