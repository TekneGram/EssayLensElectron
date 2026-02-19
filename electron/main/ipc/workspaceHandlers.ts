import path from 'node:path';
import { appErr, appOk } from '../../shared/appResult';
import type { GetCurrentFolderResponse, ListFilesRequest, ListFilesResponse, SelectFolderResponse, WorkspaceFileDto } from '../../shared/workspaceContracts';
import { WorkspaceRepository } from '../db/repositories/workspaceRepository';
import { scanFilesInWorkspace, type ScannedFile } from '../services/fileScanner';
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
  repository: WorkspaceRepository;
  scanFiles: (folderPath: string) => Promise<ScannedFile[]>;
}

function getDefaultDeps(): WorkspaceHandlerDeps {
  const electron = require('electron') as typeof import('electron');
  return {
    dialog: electron.dialog,
    repository: new WorkspaceRepository(),
    scanFiles: scanFilesInWorkspace
  };
}

function fileKindFromPath(filePath: string): string {
  const extension = path.extname(filePath).replace('.', '').toLowerCase();
  switch (extension) {
    case 'docx':
    case 'pdf':
    case 'jpeg':
    case 'jpg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'bmp':
    case 'svg':
    case 'heic':
    case 'heif':
    case 'avif':
    case 'tiff':
    case 'tif':
      return extension;
    default:
      return 'unknown';
  }
}

function toWorkspaceFileDtos(folderId: string, scannedFiles: ScannedFile[]): WorkspaceFileDto[] {
  return scannedFiles.map((file) => ({
    id: file.path,
    folderId,
    name: file.name,
    path: file.path,
    kind: fileKindFromPath(file.path)
  }));
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
        return appOk<SelectFolderResponse>({ folder: null });
      }

      const folder = await deps.repository.setCurrentFolder(selectedPath);
      const scannedFiles = await deps.scanFiles(folder.path);
      const fileRecords = toWorkspaceFileDtos(folder.id, scannedFiles);
      await deps.repository.upsertFiles(folder.id, fileRecords);

      return appOk<SelectFolderResponse>({ folder });
    } catch (error) {
      return appErr({
        code: 'WORKSPACE_SELECT_FOLDER_FAILED',
        message: 'Could not select a folder.',
        details: error
      });
    }
  });
  ipcMain.handle(WORKSPACE_CHANNELS.listFiles, async (_event, requestPayload) => {
    const request =
      typeof requestPayload === 'object' && requestPayload !== null && 'folderId' in requestPayload
        ? (requestPayload as ListFilesRequest)
        : null;
    const folderId = typeof request?.folderId === 'string' ? request.folderId : '';
    if (!folderId) {
      return appErr({
        code: 'WORKSPACE_LIST_FILES_FAILED',
        message: 'Missing folder id for file listing.'
      });
    }

    try {
      const files = await deps.repository.listFiles(folderId);
      return appOk<ListFilesResponse>({ files });
    } catch (error) {
      return appErr({
        code: 'WORKSPACE_LIST_FILES_FAILED',
        message: 'Could not load files for selected folder.',
        details: error
      });
    }
  });

  ipcMain.handle(WORKSPACE_CHANNELS.getCurrentFolder, async () => {
    try {
      const folder = await deps.repository.getCurrentFolder();
      return appOk<GetCurrentFolderResponse>({ folder });
    } catch (error) {
      return appErr({
        code: 'WORKSPACE_GET_CURRENT_FOLDER_FAILED',
        message: 'Could not load current folder.',
        details: error
      });
    }
  });
}
