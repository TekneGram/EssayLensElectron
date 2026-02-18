export interface WorkspaceFolderDto {
  id: string;
  path: string;
  name: string;
}

export interface WorkspaceFileDto {
  id: string;
  folderId: string;
  name: string;
  path: string;
  kind: string;
}

export interface SelectFolderResultData {
  folder: WorkspaceFolderDto | null;
}

export interface ListFilesResultData {
  files: WorkspaceFileDto[];
}

export interface GetCurrentFolderResultData {
  folder: WorkspaceFolderDto | null;
}
