import path from 'node:path';
import { appErr, appOk } from '../../shared/appResult';
import type { SelectFolderResultData } from '../../shared/workspaceContracts';
import { notImplementedResult } from './result';
import type { IpcMainLike } from './types';

export const WORKSPACE_CHANNELS = {
  selectFolder: 'workspace/selectFolder',
  listFiles: 'workspace/listFiles',
  getCurrentFolder: 'workspace/getCurrentFolder'
} as const;

interface OpenDialogResult {
  canceled: boolean;
  filePaths: string[];
}

interface DialogLike {
  showOpenDialog(options: { properties: Array<'openDirectory'>; title: string }): Promise<OpenDialogResult>;
}

interface WorkspaceHandlerDeps {
  dialog: DialogLike;
}

function getDefaultDeps(): WorkspaceHandlerDeps {
  const electron = require('electron') as typeof import('electron');
  return {
    dialog: electron.dialog
  };
}

export function registerWorkspaceHandlers(ipcMain: IpcMainLike, deps: WorkspaceHandlerDeps = getDefaultDeps()): void {
  ipcMain.handle(WORKSPACE_CHANNELS.selectFolder, async () => {
    try {
      const selection = await deps.dialog.showOpenDialog({
        title: 'Select Workspace Folder',
        properties: ['openDirectory']
      });
      const selectedPath = selection.filePaths[0];
      if (selection.canceled || !selectedPath) {
        return appOk<SelectFolderResultData>({ folder: null });
      }

      return appOk<SelectFolderResultData>({
        folder: {
          id: selectedPath,
          path: selectedPath,
          name: path.basename(selectedPath)
        }
      });
    } catch (error) {
      return appErr({
        code: 'WORKSPACE_SELECT_FOLDER_FAILED',
        message: 'Could not select a folder.',
        details: error
      });
    }
  });
  ipcMain.handle(WORKSPACE_CHANNELS.listFiles, async () =>
    notImplementedResult('workspace.listFiles')
  );
  ipcMain.handle(WORKSPACE_CHANNELS.getCurrentFolder, async () =>
    notImplementedResult('workspace.getCurrentFolder')
  );
}
