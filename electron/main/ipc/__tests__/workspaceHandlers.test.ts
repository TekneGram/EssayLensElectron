import { describe, expect, it, vi } from 'vitest';
import { registerWorkspaceHandlers, WORKSPACE_CHANNELS } from '../workspaceHandlers';

describe('registerWorkspaceHandlers', () => {
  it('returns selected folder data when a directory is chosen', async () => {
    const handle = vi.fn();
    const showOpenDialog = vi.fn().mockResolvedValue({
      canceled: false,
      filePaths: ['/tmp/essays']
    });

    registerWorkspaceHandlers(
      { handle },
      {
        dialog: { showOpenDialog }
      }
    );

    const handler = handle.mock.calls.find(([channel]) => channel === WORKSPACE_CHANNELS.selectFolder)?.[1];
    expect(handler).toBeTypeOf('function');
    const selectFolderHandler = handler as (event: unknown) => Promise<unknown>;
    const result = await selectFolderHandler({});

    expect(result).toEqual({
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

  it('returns null folder on picker cancel', async () => {
    const handle = vi.fn();
    const showOpenDialog = vi.fn().mockResolvedValue({
      canceled: true,
      filePaths: []
    });

    registerWorkspaceHandlers(
      { handle },
      {
        dialog: { showOpenDialog }
      }
    );

    const handler = handle.mock.calls.find(([channel]) => channel === WORKSPACE_CHANNELS.selectFolder)?.[1];
    expect(handler).toBeTypeOf('function');
    const selectFolderHandler = handler as (event: unknown) => Promise<unknown>;
    const result = await selectFolderHandler({});

    expect(result).toEqual({ ok: true, data: { folder: null } });
  });
});
