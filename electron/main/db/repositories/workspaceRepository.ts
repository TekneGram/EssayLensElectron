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
  async setCurrentFolder(_path: string): Promise<WorkspaceFolderRecord> {
    return {
      id: 'phase2-folder-placeholder',
      path: '',
      name: ''
    };
  }

  async getCurrentFolder(): Promise<WorkspaceFolderRecord | null> {
    return null;
  }

  async listFiles(_folderId: string): Promise<WorkspaceFileRecord[]> {
    return [];
  }
}
