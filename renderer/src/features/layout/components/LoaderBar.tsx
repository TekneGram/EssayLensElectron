interface LoaderBarProps {
  isLoading: boolean;
  onSelectFolder: () => void;
}

export function LoaderBar({ isLoading, onSelectFolder }: LoaderBarProps) {
  return (
    <aside className="loader-bar" data-testid="loader-bar" aria-label="Loader bar">
      <button type="button" onClick={onSelectFolder} disabled={isLoading}>
        {isLoading ? 'Selecting...' : 'Select Folder'}
      </button>
    </aside>
  );
}
