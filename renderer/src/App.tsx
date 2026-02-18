import { useState } from 'react';
import { AssessmentWindow } from './features/assessment-window/components/AssessmentWindow';
import { AssessmentTab } from './features/assessment-tab/components/AssessmentTab';
import { ChatInterface } from './features/layout/components/ChatInterface';
import { ChatView } from './features/layout/components/ChatView';
import { FileDisplayBar } from './features/layout/components/FileDisplayBar';
import { LoaderBar } from './features/layout/components/LoaderBar';
import { RubricTab } from './features/rubric-tab/components/RubricTab';

export type TopTab = 'assessment' | 'rubric';

export function App() {
  const [activeTab, setActiveTab] = useState<TopTab>('assessment');

  return (
    <div className="app-shell" data-testid="app-shell">
      <LoaderBar />
      <FileDisplayBar />
      <AssessmentWindow
        activeTab={activeTab}
        onTabChange={setActiveTab}
        assessmentPanel={<AssessmentTab selectedFileType="docx" />}
        rubricPanel={<RubricTab />}
      />
      <ChatView />
      <ChatInterface />
    </div>
  );
}
