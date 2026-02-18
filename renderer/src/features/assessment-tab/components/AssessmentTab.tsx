import { useRef } from 'react';
import { selectActiveCommentsTab, selectAssessmentSplitRatio, useAppDispatch, useAppState } from '../../../state';
import type { CommentsTab, SelectedFileType } from '../../../state';

interface AssessmentTabProps {
  selectedFileType: SelectedFileType;
}

function ImageView() {
  return (
    <section className="image-view subpane" data-testid="image-view">
      <h4>ImageView</h4>
      <div className="content-block">Image preview area.</div>
    </section>
  );
}

function OriginalTextView({ text }: { text: string }) {
  return (
    <section className="original-text-view subpane" data-testid="original-text-view">
      <h4>OriginalTextView</h4>
      <div className="content-block">{text}</div>
    </section>
  );
}

function CommentsView({ activeTab, onTabChange }: { activeTab: CommentsTab; onTabChange: (tab: CommentsTab) => void }) {
  return (
    <section className="comments-view subpane">
      <h4>CommentsView</h4>
      <div role="tablist" aria-label="Comments tabs" className="comments-tabs tabs">
        <button
          type="button"
          className={activeTab === 'comments' ? 'tab active is-active' : 'tab'}
          role="tab"
          aria-selected={activeTab === 'comments'}
          onClick={() => onTabChange('comments')}
        >
          Comments
        </button>
        <button
          type="button"
          className={activeTab === 'score' ? 'tab active is-active' : 'tab'}
          role="tab"
          aria-selected={activeTab === 'score'}
          onClick={() => onTabChange('score')}
        >
          Score
        </button>
      </div>
      <div className="comments-content">
        <div className="content-block comments-panel" role="tabpanel" hidden={activeTab !== 'comments'}>
          CommentView
        </div>
        <div className="content-block comments-panel" role="tabpanel" hidden={activeTab !== 'score'}>
          ScoreTool
        </div>
      </div>
    </section>
  );
}

export function AssessmentTab({ selectedFileType }: AssessmentTabProps) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const activeCommentsTab = selectActiveCommentsTab(state);
  const assessmentSplitRatio = selectAssessmentSplitRatio(state);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedFile = state.workspace.files.find((file) => file.id === state.workspace.selectedFile.fileId) ?? null;
  const isImageViewOpen = selectedFileType === 'image';
  const mode = isImageViewOpen ? 'three-pane' : 'two-pane';
  const originalText =
    selectedFileType === 'docx' || selectedFileType === 'pdf'
      ? `OriginalTextView: ${selectedFile?.name ?? 'No file selected.'}`
      : 'OriginalTextView';

  const setSplitRatio = (ratio: number) => {
    dispatch({ type: 'ui/setAssessmentSplitRatio', payload: ratio });
  };

  const updateRatioFromClientX = (clientX: number) => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const bounds = container.getBoundingClientRect();
    if (bounds.width <= 0) {
      return;
    }
    const ratio = (clientX - bounds.left) / bounds.width;
    setSplitRatio(ratio);
  };

  const onSplitterPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();

    const onPointerMove = (moveEvent: PointerEvent) => {
      updateRatioFromClientX(moveEvent.clientX);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const onSplitterKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setSplitRatio(assessmentSplitRatio - 0.02);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setSplitRatio(assessmentSplitRatio + 0.02);
    }
  };

  return (
    <div
      ref={containerRef}
      className="assessment-tab workspace assessment"
      data-testid="assessment-tab"
      data-mode={mode}
      style={
        {
          '--assessment-left-ratio': String(assessmentSplitRatio)
        } as React.CSSProperties
      }
    >
      {isImageViewOpen ? <ImageView /> : null}
      <OriginalTextView text={originalText} />
      {!isImageViewOpen ? (
        <div
          className="assessment-splitter"
          data-testid="assessment-splitter"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize assessment panes"
          tabIndex={0}
          onPointerDown={onSplitterPointerDown}
          onKeyDown={onSplitterKeyDown}
        />
      ) : null}
      <CommentsView
        activeTab={activeCommentsTab}
        onTabChange={(tab) => dispatch({ type: 'ui/setCommentsTab', payload: tab })}
      />
    </div>
  );
}
