import type { SelectFolderResponse, WorkspaceFileDto } from '../../../../../electron/shared/workspaceContracts';
import { fileKindFromExtension } from './fileKind';
import type { WorkspaceFile, WorkspaceFolder } from './workspace.types';

export function toWorkspaceFolder(folder: SelectFolderResponse['folder']): WorkspaceFolder | null {
  if (!folder) {
    return null;
  }

  return {
    id: folder.id,
    path: folder.path,
    name: folder.name
  };
}

export function toWorkspaceFiles(files: WorkspaceFileDto[]): WorkspaceFile[] {
  return files.map((file) => ({
    id: file.id,
    folderId: file.folderId,
    name: file.name,
    path: file.path,
    kind: fileKindFromExtension(file.kind)
  }));
}
