import type { ReactNode } from 'react';
import type { TopTab } from '../../../App';

interface AssessmentWindowProps {
  activeTab: TopTab;
  onTabChange: (tab: TopTab) => void;
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
    <section className="assessment-window" data-testid="assessment-window" aria-label="Assessment window">
      <div role="tablist" aria-label="Assessment window tabs" className="assessment-window-tabs">
        <button
          id="assessment-tab"
          role="tab"
          type="button"
          aria-selected={activeTab === 'assessment'}
          aria-controls="assessment-panel"
          className={activeTab === 'assessment' ? 'tab is-active' : 'tab'}
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
          className={activeTab === 'rubric' ? 'tab is-active' : 'tab'}
          onClick={() => onTabChange('rubric')}
        >
          Rubric
        </button>
      </div>

      <div
        id="assessment-panel"
        role="tabpanel"
        aria-labelledby="assessment-tab"
        data-testid="assessment-panel"
        hidden={activeTab !== 'assessment'}
      >
        {assessmentPanel}
      </div>

      <div
        id="rubric-panel"
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
