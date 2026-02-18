import { notImplementedResult } from './result';
import type { IpcMainLike } from './types';

export const WORKSPACE_CHANNELS = {
  selectFolder: 'workspace/selectFolder',
  listFiles: 'workspace/listFiles',
  getCurrentFolder: 'workspace/getCurrentFolder'
} as const;

export function registerWorkspaceHandlers(ipcMain: IpcMainLike): void {
  ipcMain.handle(WORKSPACE_CHANNELS.selectFolder, async () =>
    notImplementedResult('workspace.selectFolder')
  );
  ipcMain.handle(WORKSPACE_CHANNELS.listFiles, async () =>
    notImplementedResult('workspace.listFiles')
  );
  ipcMain.handle(WORKSPACE_CHANNELS.getCurrentFolder, async () =>
    notImplementedResult('workspace.getCurrentFolder')
  );
}
