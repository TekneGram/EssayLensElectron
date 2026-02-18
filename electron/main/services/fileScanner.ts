export interface ScannedFile {
  path: string;
  name: string;
  extension: string;
}

export async function scanFilesInWorkspace(_folderPath: string): Promise<ScannedFile[]> {
  return [];
}
