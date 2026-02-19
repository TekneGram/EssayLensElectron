import { useState } from 'react';
import { AssessmentWindow } from './features/assessment-window/components/AssessmentWindow';
import { AssessmentTab } from './features/assessment-tab/components/AssessmentTab';
import type { AssessmentTabChatBindings } from './features/assessment-tab/types';
import { FileControlContainer } from './features/file-control/FileControlContainer';
import { ChatCollapsedRail } from './features/layout/components/ChatCollapsedRail';
import { ChatInterface } from './features/layout/components/ChatInterface';
import { ChatView } from './features/layout/components/ChatView';
import { RubricTab } from './features/rubric-tab/components/RubricTab';
import { selectActiveTopTab, selectIsChatCollapsed, selectSelectedFileType, useAppDispatch, useAppState } from './state';

export function App() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [assessmentChatBindings, setAssessmentChatBindings] = useState<AssessmentTabChatBindings | null>(null);
  const activeTopTab = selectActiveTopTab(state);
  const selectedFileType = selectSelectedFileType(state);
  const isChatCollapsed = selectIsChatCollapsed(state);

  const collapseChat = () => dispatch({ type: 'ui/setChatCollapsed', payload: true });
  const expandChat = () => dispatch({ type: 'ui/setChatCollapsed', payload: false });

  return (
    <div className="app-shell" data-testid="app-shell" data-chat-collapsed={isChatCollapsed}>
      <FileControlContainer />
      <AssessmentWindow
        activeTab={activeTopTab}
        onTabChange={(tab) => dispatch({ type: 'ui/setTopTab', payload: tab })}
        assessmentPanel={<AssessmentTab selectedFileType={selectedFileType} onChatBindingsChange={setAssessmentChatBindings} />}
        rubricPanel={<RubricTab />}
      />
      {isChatCollapsed ? <ChatCollapsedRail onExpand={expandChat} /> : <ChatView onCollapse={collapseChat} />}
      <ChatInterface onChatIntent={expandChat} {...(assessmentChatBindings ?? {})} />
    </div>
  );
}
