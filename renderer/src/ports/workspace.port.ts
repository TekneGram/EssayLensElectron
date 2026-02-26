import type { AppResult } from '../../../electron/shared/appResult';
import type { ListFilesResponse, SelectFolderResponse } from '../../../electron/shared/workspaceContracts';

export type SelectFolderResult = AppResult<SelectFolderResponse>;
export type ListFilesResult = AppResult<ListFilesResponse>;

export interface WorkspacePort {
  selectFolder(): Promise<SelectFolderResult>;
  listFiles(folderId: string): Promise<ListFilesResult>;
}
