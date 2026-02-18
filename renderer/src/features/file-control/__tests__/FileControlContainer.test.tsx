import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { toast, ToastContainer } from 'react-toastify';
import { createAppQueryClient } from '../../../app/queryClient';
import { AppStateProvider, useAppState } from '../../../state';
import { FileControlContainer } from '../FileControlContainer';

function WorkspaceStateProbe() {
  const state = useAppState();
  return (
    <div>
      <span data-testid="workspace-folder-name">{state.workspace.currentFolder?.name ?? 'none'}</span>
      <span data-testid="workspace-status">{state.workspace.status}</span>
      <span data-testid="workspace-error">{state.workspace.error ?? 'none'}</span>
    </div>
  );
}

function renderWithProviders() {
  const queryClient = createAppQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        <ToastContainer />
        <FileControlContainer />
        <WorkspaceStateProbe />
      </AppStateProvider>
    </QueryClientProvider>
  );
}

describe('FileControlContainer', () => {
  it('updates reducer state on successful folder selection', async () => {
    const selectFolder = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        folder: {
          id: '/Users/danielparsons/Documents/Essays',
          path: '/Users/danielparsons/Documents/Essays',
          name: 'Essays'
        }
      }
    });

    Object.defineProperty(window, 'api', {
      value: {
        workspace: { selectFolder },
        assessment: {},
        rubric: {},
        chat: {}
      },
      configurable: true
    });

    renderWithProviders();

    fireEvent.click(screen.getByRole('button', { name: 'Select Folder' }));

    await waitFor(() => {
      expect(screen.getByTestId('workspace-folder-name').textContent).toBe('Essays');
    });
    expect(screen.getByTestId('workspace-status').textContent).toBe('idle');
    expect(screen.getByTestId('workspace-error').textContent).toBe('none');
    expect(selectFolder).toHaveBeenCalledTimes(1);
  });

  it('sets concise error state and notifies toast on failure', async () => {
    const toastSpy = vi.spyOn(toast, 'error').mockImplementation(() => 'toast-id');
    const selectFolder = vi.fn().mockResolvedValue({
      ok: false,
      error: {
        code: 'WORKSPACE_SELECT_FOLDER_FAILED',
        message: 'Could not select folder'
      }
    });

    Object.defineProperty(window, 'api', {
      value: {
        workspace: { selectFolder },
        assessment: {},
        rubric: {},
        chat: {}
      },
      configurable: true
    });

    renderWithProviders();

    fireEvent.click(screen.getByRole('button', { name: 'Select Folder' }));

    await waitFor(() => {
      expect(screen.getByTestId('workspace-status').textContent).toBe('error');
    });
    expect(screen.getByTestId('workspace-error').textContent).toBe('Could not select folder');
    expect(toastSpy).toHaveBeenCalledWith('Could not select folder');

    toastSpy.mockRestore();
  });
});
