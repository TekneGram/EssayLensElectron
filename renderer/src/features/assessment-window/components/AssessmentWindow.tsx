import type { ReactNode } from 'react';
import type { AssessmentTopTab } from '../../../state';

interface AssessmentWindowProps {
  activeTab: AssessmentTopTab;
  onTabChange: (tab: AssessmentTopTab) => void;
  assessmentPanel: ReactNode;
  rubricPanel: ReactNode;
}

export function AssessmentWindow({
  activeTab,
  onTabChange,
  assessmentPanel,
  rubricPanel
}: AssessmentWindowProps) {
  return (
    <section className="assessment-window pane main" data-testid="assessment-window" aria-label="Assessment window">
      <div className="main-head">
        <h3>AssessmentWindow</h3>
        <div role="tablist" aria-label="Assessment window tabs" className="assessment-window-tabs tabs">
          <button
            id="assessment-tab"
            role="tab"
            type="button"
            aria-selected={activeTab === 'assessment'}
            aria-controls="assessment-panel"
            className={activeTab === 'assessment' ? 'tab active is-active' : 'tab'}
            onClick={() => onTabChange('assessment')}
          >
            Assessment
          </button>
          <button
            id="rubric-tab"
            role="tab"
            type="button"
            aria-selected={activeTab === 'rubric'}
            aria-controls="rubric-panel"
            className={activeTab === 'rubric' ? 'tab active is-active' : 'tab'}
            onClick={() => onTabChange('rubric')}
          >
            Rubric
          </button>
        </div>
      </div>

      <div
        id="assessment-panel"
        className="workspace-panel"
        role="tabpanel"
        aria-labelledby="assessment-tab"
        data-testid="assessment-panel"
        hidden={activeTab !== 'assessment'}
      >
        {assessmentPanel}
      </div>

      <div
        id="rubric-panel"
        className="workspace-panel"
        role="tabpanel"
        aria-labelledby="rubric-tab"
        data-testid="rubric-panel"
        hidden={activeTab !== 'rubric'}
      >
        {rubricPanel}
      </div>
    </section>
  );
}
