import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../../App';
import { AppProviders } from '../../../app/AppProviders';
import { createAppQueryClient } from '../../../app/queryClient';
import { CommentsView } from '../components/CommentsView';
import type { FeedbackItem } from '../../../types';

function createInlineComment(): FeedbackItem {
  return {
    id: 'feedback-inline-1',
    fileId: '/workspace/essays/draft.docx',
    source: 'teacher',
    kind: 'inline',
    commentText: 'Clarify this sentence for precision.',
    exactQuote:
      'This is a much longer quote that should get truncated in the preview because it exceeds the component limit.',
    prefixText: 'Some prefix context',
    suffixText: 'Some suffix context',
    startAnchor: {
      part: 'renderer://original-text-view',
      paragraphIndex: 0,
      runIndex: 0,
      charOffset: 5
    },
    endAnchor: {
      part: 'renderer://original-text-view',
      paragraphIndex: 0,
      runIndex: 0,
      charOffset: 28
    },
    createdAt: new Date('2026-02-19T12:00:00.000Z').toISOString(),
    applied: false
  };
}

describe('CommentsView interactions', () => {
  it('renders comment rows and emits tool actions', () => {
    const inlineComment = createInlineComment();
    const onSelectComment = vi.fn();
    const onEditComment = vi.fn();
    const onDeleteComment = vi.fn();
    const onSendToLlm = vi.fn();
    const onApplyComment = vi.fn();

    render(
      <CommentsView
        comments={[inlineComment]}
        activeCommentId={null}
        isLoading={false}
        onSelectComment={onSelectComment}
        onEditComment={onEditComment}
        onDeleteComment={onDeleteComment}
        onSendToLlm={onSendToLlm}
        onApplyComment={onApplyComment}
        activeTab="comments"
        onTabChange={vi.fn()}
      />
    );

    expect(screen.getByText('Quote:')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Select Inline comment/i }));
    expect(onSelectComment).toHaveBeenCalledWith('feedback-inline-1');

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Edit comment text' }), {
      target: { value: 'Updated comment text from tools.' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onEditComment).toHaveBeenCalledWith('feedback-inline-1', 'Updated comment text from tools.');

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDeleteComment).toHaveBeenCalledWith('feedback-inline-1');

    fireEvent.click(screen.getByRole('button', { name: 'Send to LLM' }));
    expect(onSendToLlm).toHaveBeenCalledWith('feedback-inline-1', undefined);

    fireEvent.change(screen.getByRole('combobox', { name: 'Send command' }), {
      target: { value: 'check-hedging' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send to LLM' }));
    expect(onSendToLlm).toHaveBeenCalledWith('feedback-inline-1', 'check-hedging');

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApplyComment).toHaveBeenCalledWith('feedback-inline-1', true);
  });

  it('maps selected inline comment into OriginalTextView pending quote through AssessmentTab', async () => {
    const selectFolder = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        folder: {
          id: '/workspace/essays',
          path: '/workspace/essays',
          name: 'essays'
        }
      }
    });
    const listFiles = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        files: [
          {
            id: '/workspace/essays/draft.docx',
            folderId: '/workspace/essays',
            name: 'draft.docx',
            path: '/workspace/essays/draft.docx',
            kind: 'docx'
          }
        ]
      }
    });
    const listFeedback = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        feedback: [createInlineComment()]
      }
    });
    const addFeedback = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        feedback: {
          id: 'feedback-1',
          fileId: '/workspace/essays/draft.docx',
          source: 'teacher',
          kind: 'block',
          commentText: 'Nice work.',
          createdAt: new Date().toISOString()
        }
      }
    });

    Object.defineProperty(window, 'api', {
      value: {
        workspace: { selectFolder, listFiles },
        assessment: { listFeedback, addFeedback },
        rubric: {},
        chat: {}
      },
      configurable: true
    });

    const queryClient = createAppQueryClient();
    render(
      <AppProviders queryClient={queryClient}>
        <App />
      </AppProviders>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Select Folder' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'draft.docx' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'draft.docx' }));

    await waitFor(() => {
      expect(screen.getByText('Clarify this sentence for precision.')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /Select Inline comment/i }));

    await waitFor(() => {
      expect(screen.getByText(/Pending quote:/).textContent).toContain('should get truncated');
    });
  });
});
