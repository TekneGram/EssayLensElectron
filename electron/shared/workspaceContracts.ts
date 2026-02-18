export interface WorkspaceFolderDto {
  id: string;
  path: string;
  name: string;
}

export interface SelectFolderResultData {
  folder: WorkspaceFolderDto | null;
}
