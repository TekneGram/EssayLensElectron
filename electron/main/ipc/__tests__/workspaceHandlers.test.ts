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
      },
      {
        path: '/tmp/essays/archive.zip',
        name: 'archive.zip',
        extension: 'zip'
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
    const selectedFolderId =
      typeof selectResult === 'object' &&
      selectResult !== null &&
      'ok' in selectResult &&
      (selectResult as { ok: boolean }).ok
        ? (selectResult as { data: { folder: { id: string } } }).data.folder.id
        : null;

    expect(selectResult).toMatchObject({
      ok: true,
      data: {
        folder: {
          id: expect.any(String),
          path: '/tmp/essays',
          name: 'essays'
        }
      }
    });
    expect(selectedFolderId).not.toBe('/tmp/essays');
    expect(selectedFolderId).toBeTruthy();

    const listResult = await listFilesHandler({}, { folderId: selectedFolderId });
    expect(listResult).toMatchObject({
      ok: true,
      data: {
        files: [
          {
            id: expect.any(String),
            folderId: selectedFolderId,
            name: 'draft.docx',
            path: '/tmp/essays/draft.docx',
            kind: 'docx'
          }
        ]
      }
    });
    const listedFileId = (listResult as { data: { files: Array<{ id: string }> } }).data.files[0]?.id;
    expect(listedFileId).toBeTruthy();
    expect(listedFileId).not.toBe('/tmp/essays/draft.docx');

    const currentFolderResult = await getCurrentFolderHandler({});
    expect(currentFolderResult).toMatchObject({
      ok: true,
      data: {
        folder: {
          id: selectedFolderId,
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
