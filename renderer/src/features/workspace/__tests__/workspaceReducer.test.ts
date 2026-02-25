import { describe, expect, it } from 'vitest';
import type { WorkspaceState } from '../domain/workspace.types';
import { initialWorkspaceState, workspaceReducer } from '../state/workspace.reducer';

describe('workspaceReducer', () => {
  it('sets current folder', () => {
    const next = workspaceReducer(initialWorkspaceState, {
      type: 'workspace/setFolder',
      payload: { id: 'folder-1', name: 'Essays', path: '/tmp/essays' }
    });

    expect(next.currentFolder?.id).toBe('folder-1');
    expect(initialWorkspaceState.currentFolder).toBeNull();
  });

  it('adds document text without mutating previous state', () => {
    const state: WorkspaceState = {
      ...initialWorkspaceState,
      documentTextByFileId: {
        fileA: { fileId: 'fileA', text: 'first' }
      }
    };

    const next = workspaceReducer(state, {
      type: 'workspace/setDocumentText',
      payload: { fileId: 'fileB', text: 'second' }
    });

    expect(next.documentTextByFileId.fileB?.text).toBe('second');
    expect(state.documentTextByFileId.fileB).toBeUndefined();
  });
});
