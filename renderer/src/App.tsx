import { AssessmentWindow } from './features/assessment-window/components/AssessmentWindow';
import { AssessmentTab } from './features/assessment-tab/components/AssessmentTab';
import { FileControlContainer } from './features/file-control/FileControlContainer';
import { ChatInterface } from './features/layout/components/ChatInterface';
import { ChatView } from './features/layout/components/ChatView';
import { RubricTab } from './features/rubric-tab/components/RubricTab';
import { selectActiveTopTab, selectSelectedFileType, useAppDispatch, useAppState } from './state';

export function App() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const activeTopTab = selectActiveTopTab(state);
  const selectedFileType = selectSelectedFileType(state);

  return (
    <div className="app-shell" data-testid="app-shell">
      <FileControlContainer />
      <AssessmentWindow
        activeTab={activeTopTab}
        onTabChange={(tab) => dispatch({ type: 'ui/setTopTab', payload: tab })}
        assessmentPanel={<AssessmentTab selectedFileType={selectedFileType} />}
        rubricPanel={<RubricTab />}
      />
      <ChatView />
      <ChatInterface />
    </div>
  );
}
