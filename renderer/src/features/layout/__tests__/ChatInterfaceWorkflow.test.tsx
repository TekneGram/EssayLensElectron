import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../../App';
import { AppProviders } from '../../../app/AppProviders';
import { createAppQueryClient } from '../../../app/queryClient';

function createWorkspaceMocks() {
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
  return { selectFolder, listFiles };
}

function renderApp() {
  const queryClient = createAppQueryClient();
  render(
    <AppProviders queryClient={queryClient}>
      <App />
    </AppProviders>
  );
}

describe('ChatInterface submit workflow', () => {
  it('submits comment mode as inline AddFeedbackRequest when selection exists', async () => {
    const { selectFolder, listFiles } = createWorkspaceMocks();
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
          kind: 'inline',
          commentText: 'Please tighten this phrase.',
          exactQuote: 'draft.docx',
          prefixText: 'OriginalTextView: ',
          suffixText: '\n\nUse this area to review',
          startAnchor: {
            part: 'renderer://original-text-view',
            paragraphIndex: 0,
            runIndex: 0,
            charOffset: 18
          },
          endAnchor: {
            part: 'renderer://original-text-view',
            paragraphIndex: 0,
            runIndex: 0,
            charOffset: 27
          },
          createdAt: new Date().toISOString()
        }
      }
    });
    const sendMessage = vi.fn();

    Object.defineProperty(window, 'api', {
      value: {
        workspace: { selectFolder, listFiles },
        assessment: { listFeedback, addFeedback },
        rubric: {},
        chat: { sendMessage }
      },
      configurable: true
    });

    renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Select Folder' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'draft.docx' })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: 'draft.docx' }));

    const windowNode = await screen.findByTestId('text-view-window');
    const paragraphNode = windowNode.querySelector('p');
    expect(paragraphNode).toBeTruthy();
    if (!paragraphNode?.firstChild) {
      throw new Error('Expected paragraph text node to exist');
    }

    const quoteStart = paragraphNode.textContent?.indexOf('draft.docx') ?? -1;
    expect(quoteStart).toBeGreaterThanOrEqual(0);
    const quoteEnd = quoteStart + 'draft.docx'.length;
    const range = document.createRange();
    range.setStart(paragraphNode.firstChild, quoteStart);
    range.setEnd(paragraphNode.firstChild, quoteEnd);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    fireEvent.mouseUp(windowNode);

    fireEvent.change(screen.getByRole('textbox', { name: 'Message' }), {
      target: { value: 'Please tighten this phrase.' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send comment' }));

    await waitFor(() => {
      expect(addFeedback).toHaveBeenCalledTimes(1);
    });

    expect(addFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: '/workspace/essays/draft.docx',
        kind: 'inline',
        source: 'teacher',
        commentText: 'Please tighten this phrase.',
        exactQuote: 'draft.docx'
      })
    );
    expect(sendMessage).not.toHaveBeenCalled();

    await waitFor(() => {
      expect((screen.getByRole('textbox', { name: 'Message' }) as HTMLTextAreaElement).value).toBe('');
    });
  });

  it('submits chat mode through chat API and appends teacher + assistant messages', async () => {
    const { selectFolder, listFiles } = createWorkspaceMocks();
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
          commentText: 'block comment',
          createdAt: new Date().toISOString()
        }
      }
    });
    const sendMessage = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        reply: 'Assistant workflow reply.'
      }
    });

    Object.defineProperty(window, 'api', {
      value: {
        workspace: { selectFolder, listFiles },
        assessment: { listFeedback, addFeedback },
        rubric: {},
        chat: { sendMessage }
      },
      configurable: true
    });

    renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Select Folder' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'draft.docx' })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: 'draft.docx' }));

    fireEvent.click(screen.getByRole('button', { name: 'Show Process Center' }));
    fireEvent.click(screen.getByRole('button', { name: 'Select Command' }));

    await waitFor(() => {
      expect(screen.getByTestId('assessment-chat-interface-stub').textContent).toBe('chat:true:evaluate-thesis');
    });

    fireEvent.change(screen.getByRole('textbox', { name: 'Message' }), {
      target: { value: 'How should I sequence feedback?' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send chat message' }));

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith({
        fileId: '/workspace/essays/draft.docx',
        message: 'How should I sequence feedback?',
        contextText: undefined
      });
    });
    expect(addFeedback).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText('[teacher] How should I sequence feedback?')).toBeTruthy();
      expect(screen.getByText('[assistant] Assistant workflow reply.')).toBeTruthy();
    });
  });
});
