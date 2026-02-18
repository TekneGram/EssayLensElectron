import { describe, expect, it, vi } from 'vitest';
import { WorkspaceRepository } from '../../db/repositories/workspaceRepository';
import { registerWorkspaceHandlers, WORKSPACE_CHANNELS } from '../workspaceHandlers';

function createHandlerHarness() {
  const handle = vi.fn();
  const repository = new WorkspaceRepository();

  return {
    handle,
    repository,
    getHandler: (channel: string) => {
      const handler = handle.mock.calls.find(([registeredChannel]) => registeredChannel === channel)?.[1];
      expect(handler).toBeTypeOf('function');
      return handler as (event: unknown, payload?: unknown) => Promise<unknown>;
    }
  };
}

describe('registerWorkspaceHandlers', () => {
  it('returns selected folder data when a directory is chosen and persists scanned files', async () => {
    const harness = createHandlerHarness();
    const showOpenDialog = vi.fn().mockResolvedValue({
      canceled: false,
      filePaths: ['/tmp/essays']
    });
    const scanFiles = vi.fn().mockResolvedValue([
      {
        path: '/tmp/essays/draft.docx',
        name: 'draft.docx',
        extension: 'docx'
      }
    ]);

    registerWorkspaceHandlers(
      { handle: harness.handle },
      {
        dialog: { showOpenDialog },
        repository: harness.repository,
        scanFiles
      }
    );

    const selectFolderHandler = harness.getHandler(WORKSPACE_CHANNELS.selectFolder);
    const listFilesHandler = harness.getHandler(WORKSPACE_CHANNELS.listFiles);
    const getCurrentFolderHandler = harness.getHandler(WORKSPACE_CHANNELS.getCurrentFolder);

    const selectResult = await selectFolderHandler({});

    expect(selectResult).toEqual({
      ok: true,
      data: {
        folder: {
          id: '/tmp/essays',
          path: '/tmp/essays',
          name: 'essays'
        }
      }
    });

    const listResult = await listFilesHandler({}, { folderId: '/tmp/essays' });
    expect(listResult).toEqual({
      ok: true,
      data: {
        files: [
          {
            id: '/tmp/essays/draft.docx',
            folderId: '/tmp/essays',
            name: 'draft.docx',
            path: '/tmp/essays/draft.docx',
            kind: 'docx'
          }
        ]
      }
    });

    const currentFolderResult = await getCurrentFolderHandler({});
    expect(currentFolderResult).toEqual({
      ok: true,
      data: {
        folder: {
          id: '/tmp/essays',
          path: '/tmp/essays',
          name: 'essays'
        }
      }
    });
  });

  it('returns null folder on picker cancel and keeps current folder unchanged', async () => {
    const harness = createHandlerHarness();
    const showOpenDialog = vi.fn().mockResolvedValue({
      canceled: true,
      filePaths: []
    });

    registerWorkspaceHandlers(
      { handle: harness.handle },
      {
        dialog: { showOpenDialog },
        repository: harness.repository,
        scanFiles: vi.fn()
      }
    );

    const selectFolderHandler = harness.getHandler(WORKSPACE_CHANNELS.selectFolder);
    const getCurrentFolderHandler = harness.getHandler(WORKSPACE_CHANNELS.getCurrentFolder);

    const result = await selectFolderHandler({});

    expect(result).toEqual({ ok: true, data: { folder: null } });
    expect(await getCurrentFolderHandler({})).toEqual({ ok: true, data: { folder: null } });
  });
});
