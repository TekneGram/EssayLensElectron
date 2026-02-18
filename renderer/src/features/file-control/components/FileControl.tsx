import { FileDisplayBar } from '../../layout/components/FileDisplayBar';
import { LoaderBar } from '../../layout/components/LoaderBar';
import type { WorkspaceFile } from '../../../types';

interface FileControlProps {
  files: WorkspaceFile[];
  isLoading: boolean;
  onSelectFolder: () => void;
}

export function FileControl({ files, isLoading, onSelectFolder }: FileControlProps) {
  return (
    <>
      <LoaderBar isLoading={isLoading} onSelectFolder={onSelectFolder} />
      <FileDisplayBar files={files} />
    </>
  );
}
