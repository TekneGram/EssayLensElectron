import { FileControl } from './components/FileControl';
import { useFileControl } from './hooks/useFileControl';

export function FileControlContainer() {
  const { files, selectedFileId, isLoading, pickFolder, selectFile } = useFileControl();

  return (
    <FileControl
      files={files}
      selectedFileId={selectedFileId}
      isLoading={isLoading}
      onSelectFolder={() => void pickFolder()}
      onSelectFile={selectFile}
    />
  );
}
