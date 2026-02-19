import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../../App';
import { AppProviders } from '../../../app/AppProviders';
import { createAppQueryClient } from '../../../app/queryClient';

describe('Assessment tab file selection routing', () => {
  it('routes selected files between ImageView and OriginalTextView and appends system chat message', async () => {
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
          },
          {
            id: '/workspace/essays/image.png',
            folderId: '/workspace/essays',
            name: 'image.png',
            path: '/workspace/essays/image.png',
            kind: 'png'
          }
        ]
      }
    });

    const listFeedback = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        feedback: []
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

    fireEvent.click(screen.getByRole('button', { name: 'image.png' }));

    await waitFor(() => {
      expect(screen.getByTestId('assessment-tab').getAttribute('data-mode')).toBe('three-pane');
    });
    expect(screen.getByTestId('image-view')).toBeTruthy();
    expect(screen.getByText('[system] Selected file: image.png')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'draft.docx' }));

    await waitFor(() => {
      expect(screen.getByTestId('assessment-tab').getAttribute('data-mode')).toBe('two-pane');
    });
    expect(listFeedback).toHaveBeenCalledWith({ fileId: '/workspace/essays/draft.docx' });
    expect(screen.queryByTestId('image-view')).toBeNull();
    expect(screen.getByTestId('original-text-view').textContent).toContain('draft.docx');
    expect(screen.getByText('[system] Selected file: draft.docx')).toBeTruthy();
  });

  it('syncs command selection into ChatInterface mode lock rules through AssessmentTab orchestration', async () => {
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
        feedback: []
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
      expect(screen.getByTestId('assessment-chat-interface-stub').textContent).toBe('comment:false:no-command');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Select Command' }));

    await waitFor(() => {
      expect(screen.getByTestId('assessment-chat-interface-stub').textContent).toBe('chat:true:evaluate-thesis');
    });
    expect(screen.getByRole('button', { name: 'Switch to comment mode' }).getAttribute('disabled')).not.toBeNull();

    fireEvent.change(screen.getByRole('combobox', { name: 'Select command' }), {
      target: { value: '' }
    });

    await waitFor(() => {
      expect(screen.getByTestId('assessment-chat-interface-stub').textContent).toBe('comment:false:no-command');
    });
    expect(screen.getByRole('button', { name: 'Switch to comment mode' }).getAttribute('disabled')).toBeNull();
  });
});
