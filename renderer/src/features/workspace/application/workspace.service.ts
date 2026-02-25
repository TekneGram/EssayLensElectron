import type { WorkspaceApi } from '../infrastructure/workspace.api';
import { toWorkspaceFiles, toWorkspaceFolder } from '../domain/workspace.mappers';
import type { WorkspaceFile, WorkspaceFolder } from '../domain/workspace.types';

export interface SelectFolderResult {
  folder: WorkspaceFolder | null;
  files: WorkspaceFile[];
}

export async function selectWorkspaceFolder(workspaceApi: WorkspaceApi): Promise<SelectFolderResult> {
  const selectResult = await workspaceApi.selectFolder();

  if (!selectResult.ok) {
    throw new Error(selectResult.error.message);
  }

  if (!selectResult.data.folder) {
    return { folder: null, files: [] };
  }

  const folder = toWorkspaceFolder(selectResult.data.folder);
  if (!folder) {
    return { folder: null, files: [] };
  }

  const listResult = await workspaceApi.listFiles(folder.id);

  if (!listResult.ok) {
    throw new Error(listResult.error.message);
  }

  const files = toWorkspaceFiles(listResult.data.files);

  return { folder, files };
}
