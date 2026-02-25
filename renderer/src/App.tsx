import { useState } from 'react';
import { AssessmentWindow } from './features/assessment-window/components/AssessmentWindow';
import { AssessmentTab } from './features/assessment-tab/components/AssessmentTab';
import { ChatInterface } from './features/chat-interface';
import type { ChatInterfaceBindings } from './features/chat-interface';
import { ChatCollapsedRail, ChatView, collapseChatPanel, expandChatPanel, selectIsChatCollapsed } from './features/chat-view';
import { FileControlContainer } from './features/workspace/FileControlContainer';
import { LlmManager } from './features/llm-manager/LlmManager';
import { RubricTab } from './features/rubric-tab/components/RubricTab';
import { selectActiveTopTab, selectSelectedFileType, useAppDispatch, useAppState } from './state';

export function App() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [assessmentChatBindings, setAssessmentChatBindings] = useState<ChatInterfaceBindings | null>(null);
  const activeTopTab = selectActiveTopTab(state);
  const selectedFileType = selectSelectedFileType(state);
  const isChatCollapsed = selectIsChatCollapsed(state);

  const collapseChat = () => dispatch(collapseChatPanel());
  const expandChat = () => dispatch(expandChatPanel());

  return (
    <div className="app-shell" data-testid="app-shell" data-chat-collapsed={isChatCollapsed}>
      <FileControlContainer />
      <AssessmentWindow
        activeTab={activeTopTab}
        onTabChange={(tab) => dispatch({ type: 'ui/setTopTab', payload: tab })}
        assessmentPanel={<AssessmentTab selectedFileType={selectedFileType} onChatBindingsChange={setAssessmentChatBindings} />}
        rubricPanel={<RubricTab />}
        llmPanel={<LlmManager />}
      />
      {isChatCollapsed ? <ChatCollapsedRail onExpand={expandChat} /> : <ChatView onCollapse={collapseChat} />}
      <ChatInterface onChatIntent={expandChat} {...(assessmentChatBindings ?? {})} />
    </div>
  );
}
