export interface WorkspaceFolderRecord {
  id: string;
  path: string;
  name: string;
}

export interface WorkspaceFileRecord {
  id: string;
  folderId: string;
  name: string;
  path: string;
  kind: string;
}

export class WorkspaceRepository {
  private currentFolder: WorkspaceFolderRecord | null = null;
  private filesByFolderId = new Map<string, WorkspaceFileRecord[]>();

  async setCurrentFolder(path: string): Promise<WorkspaceFolderRecord> {
    const folder: WorkspaceFolderRecord = {
      id: path,
      path,
      name: path.split(/[\\/]/).filter(Boolean).pop() ?? path
    };
    this.currentFolder = folder;
    return folder;
  }

  async getCurrentFolder(): Promise<WorkspaceFolderRecord | null> {
    return this.currentFolder;
  }

  async upsertFiles(folderId: string, files: WorkspaceFileRecord[]): Promise<WorkspaceFileRecord[]> {
    this.filesByFolderId.set(folderId, [...files]);
    return this.filesByFolderId.get(folderId) ?? [];
  }

  async listFiles(folderId: string): Promise<WorkspaceFileRecord[]> {
    return this.filesByFolderId.get(folderId) ?? [];
  }
}
