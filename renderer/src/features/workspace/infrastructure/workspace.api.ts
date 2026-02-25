import type { AppError } from '../../../../../electron/shared/appResult';
import type { ListFilesResponse, SelectFolderResponse } from '../../../../../electron/shared/workspaceContracts';

interface AppResultSuccess<T> {
  ok: true;
  data: T;
}

interface AppResultFailure {
  ok: false;
  error: AppError;
}

export type SelectFolderResult = AppResultSuccess<SelectFolderResponse> | AppResultFailure;
export type ListFilesResult = AppResultSuccess<ListFilesResponse> | AppResultFailure;

export type WorkspaceApi = {
  selectFolder: () => Promise<SelectFolderResult>;
  listFiles: (folderId: string) => Promise<ListFilesResult>;
};

export function getWorkspaceApi(): WorkspaceApi {
  const appWindow = window as Window & { api?: { workspace?: WorkspaceApi } };
  if (!appWindow.api?.workspace) {
    throw new Error('window.api.workspace is not available.');
  }

  return appWindow.api.workspace;
}
