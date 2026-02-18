import type { WorkspaceFile } from '../../../types';

interface FileDisplayBarProps {
  files: WorkspaceFile[];
  selectedFileId: string | null;
  onSelectFile: (file: WorkspaceFile) => void;
}

export function FileDisplayBar({ files, selectedFileId, onSelectFile }: FileDisplayBarProps) {
  return (
    <aside className="file-display-bar" data-testid="file-display-bar" aria-label="File display bar">
      <h2>Files</h2>
      <ul>
        {files.length > 0 ? (
          files.map((file) => (
            <li key={file.id}>
              <button
                type="button"
                aria-current={selectedFileId === file.id}
                onClick={() => onSelectFile(file)}
              >
                {file.name}
              </button>
            </li>
          ))
        ) : (
          <li>No files selected.</li>
        )}
      </ul>
    </aside>
  );
}
