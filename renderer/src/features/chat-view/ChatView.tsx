import { ChatControl } from './components/ChatControl';
import { ChatListScreen } from './components/ChatListScreen';
import { ChatScreen } from './components/ChatScreen';
import { ActionsView } from './components/ActionsView';
import { useChatViewController } from './hooks/useChatViewController';

interface ChatViewProps {
  onCollapse: () => void;
}

export function ChatView({ onCollapse }: ChatViewProps) {
  const {
    fileEntityUuid,
    activeScreen,
    sessions,
    activeSessionId,
    sessionsStatus,
    sessionsError,
    sessionItems,
    isSessionTurnsLoading,
    sessionTurnsError,
    actionItems,
    onBack,
    onSessionSelect,
    onNewChat
  } = useChatViewController();

  return (
    <section className="chat-view pane chat" data-testid="chat-view" aria-label="Chat view">
      <div className="chat-head">
        <ChatControl
          isBackDisabled={activeScreen === 'list' || !fileEntityUuid}
          isNewChatDisabled={!fileEntityUuid}
          onBack={onBack}
          onNewChat={() => void onNewChat()}
        />
        <button className="chat-toggle chat-toggle-collapse" type="button" aria-label="Collapse chat panel" onClick={onCollapse}>
          ‹
        </button>
      </div>
      <div className="chat-main" data-testid="chat-main">
        {!fileEntityUuid ? <p className="content-block">Select a file to load chat sessions.</p> : null}
        {fileEntityUuid && activeScreen === 'list' ? (
          <ChatListScreen
            sessions={sessions}
            activeSessionId={activeSessionId}
            isLoading={sessionsStatus === 'loading'}
            error={sessionsError}
            onSessionSelect={onSessionSelect}
          />
        ) : null}
        {fileEntityUuid && activeScreen === 'chat' ? (
          <ChatScreen items={sessionItems} isLoading={isSessionTurnsLoading} error={sessionTurnsError} />
        ) : null}
      </div>
      <div className="chat-actions" data-testid="chat-actions">
        <ActionsView items={actionItems} />
      </div>
    </section>
  );
}
