import type { WorkspaceFile } from '../../../types';

interface FileDisplayBarProps {
  files: WorkspaceFile[];
}

export function FileDisplayBar({ files }: FileDisplayBarProps) {
  return (
    <aside className="file-display-bar" data-testid="file-display-bar" aria-label="File display bar">
      <h2>Files</h2>
      <ul>
        {files.length > 0 ? (
          files.map((file) => <li key={file.id}>{file.name}</li>)
        ) : (
          <li>No files selected.</li>
        )}
      </ul>
    </aside>
  );
}
