import { selectActiveCommentsTab, useAppDispatch, useAppState } from '../../../state';
import type { CommentsTab, SelectedFileType } from '../../../state';

interface AssessmentTabProps {
  selectedFileType: SelectedFileType;
}

function ImageView() {
  return (
    <section className="image-view" data-testid="image-view">
      ImageView
    </section>
  );
}

function OriginalTextView({ text }: { text: string }) {
  return (
    <section className="original-text-view" data-testid="original-text-view">
      {text}
    </section>
  );
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
  const selectedFile = state.workspace.files.find((file) => file.id === state.workspace.selectedFile.fileId) ?? null;
  const isImageViewOpen = selectedFileType === 'image';
  const mode = isImageViewOpen ? 'three-pane' : 'two-pane';
  const originalText =
    selectedFileType === 'docx' || selectedFileType === 'pdf'
      ? `OriginalTextView: ${selectedFile?.name ?? 'No file selected.'}`
      : 'OriginalTextView';

  return (
    <div className="assessment-tab" data-testid="assessment-tab" data-mode={mode}>
      {isImageViewOpen ? <ImageView /> : null}
      <OriginalTextView text={originalText} />
      <CommentsView
        activeTab={activeCommentsTab}
        onTabChange={(tab) => dispatch({ type: 'ui/setCommentsTab', payload: tab })}
      />
    </div>
  );
}
