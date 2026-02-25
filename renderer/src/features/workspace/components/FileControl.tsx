import { FileDisplayBar } from './FileDisplayBar';
import { LoaderBar } from './LoaderBar';
import type { WorkspaceFile } from '../domain/workspace.types';

interface FileControlProps {
  files: WorkspaceFile[];
  selectedFileId: string | null;
  isLoading: boolean;
  onSelectFolder: () => void;
  onSelectFile: (file: WorkspaceFile) => void;
}

export function FileControl({ files, selectedFileId, isLoading, onSelectFolder, onSelectFile }: FileControlProps) {
  return (
    <>
      <LoaderBar isLoading={isLoading} onSelectFolder={onSelectFolder} />
      <FileDisplayBar files={files} selectedFileId={selectedFileId} onSelectFile={onSelectFile} />
    </>
  );
}
