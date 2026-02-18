import { FileControl } from './components/FileControl';
import { useFileControl } from './hooks/useFileControl';

export function FileControlContainer() {
  const { files, isLoading, pickFolder } = useFileControl();

  return <FileControl files={files} isLoading={isLoading} onSelectFolder={() => void pickFolder()} />;
}
