import { selectActiveCommentsTab, useAppDispatch, useAppState } from '../../../state';
import type { CommentsTab, SelectedFileType } from '../../../state';

interface AssessmentTabProps {
  selectedFileType: SelectedFileType;
}

function ImageView() {
  return <section className="image-view">ImageView</section>;
}

function OriginalTextView() {
  return <section className="original-text-view">OriginalTextView</section>;
}

function CommentsView({ activeTab, onTabChange }: { activeTab: CommentsTab; onTabChange: (tab: CommentsTab) => void }) {
  return (
    <section className="comments-view">
      <div role="tablist" aria-label="Comments tabs">
        <button type="button" role="tab" aria-selected={activeTab === 'comments'} onClick={() => onTabChange('comments')}>
          Comments
        </button>
        <button type="button" role="tab" aria-selected={activeTab === 'score'} onClick={() => onTabChange('score')}>
          Score
        </button>
      </div>
      <div role="tabpanel" hidden={activeTab !== 'comments'}>
        CommentView
      </div>
      <div role="tabpanel" hidden={activeTab !== 'score'}>
        ScoreTool
      </div>
    </section>
  );
}

export function AssessmentTab({ selectedFileType }: AssessmentTabProps) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const activeCommentsTab = selectActiveCommentsTab(state);
  const isImageViewOpen = selectedFileType === 'image';
  const mode = isImageViewOpen ? 'three-pane' : 'two-pane';

  return (
    <div className="assessment-tab" data-mode={mode}>
      {isImageViewOpen ? <ImageView /> : null}
      <OriginalTextView />
      <CommentsView
        activeTab={activeCommentsTab}
        onTabChange={(tab) => dispatch({ type: 'ui/setCommentsTab', payload: tab })}
      />
    </div>
  );
}
