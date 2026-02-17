 # Feature Spec: File Control

  ## Purpose
  Let users choose a working folder, persist it, scan files (max depth: 2), and display results.

  ## Scope
  - In scope:
    - Folder picker trigger
    - Persist current working directory
    - Recursive scan to depth 2
    - Persist discovered files
    - Render file list
  - Out of scope:
    - File parsing/content extraction
    - Search/ranking
    - Multi-workspace support

  ## Component Split
  ### Presentational
  - `FileControl`: wrapper for loader + list
  - `LoaderBar`: button UI only
  - `FileDisplayBar`: list UI only

  ### Data/Control
  - `FileControlContainer`: binds hook to presentational props
  - `useFileControl`: orchestrates async flow/state
  - `workspaceService` (optional): use-case logic
  - `workspaceRepository`: DB writes/reads
  - `openFolderPicker`, `scanFilesTwoLevels`: platform/filesystem adapters

  ## Data Contract
  ### Input
  - User click: `onPickFolder()`

  ### Output/View Model
  - `isLoading: boolean`
  - `files: string[]`
  - `selectedFileId?: string` (optional future)

  ## Workflow
  1. User clicks `LoaderBar` button.
  2. `openFolderPicker()` returns `folderPath | null`.
  3. If null: stop.
  4. Persist cwd via `workspaceRepository.setCurrentWorkingDirectory(folderPath)`.
  5. Scan via `scanFilesTwoLevels(folderPath)`.
  6. Persist files via `workspaceRepository.upsertFiles(files)`.
  7. Update UI state (`files`, `isLoading=false`).

  ## Error Handling
  - Picker cancel: no-op.
  - Scan/persist failure:
    - set `isLoading=false`
    - expose error state/message for UI
    - do not crash shell

  ## State Ownership
  - Hook owns: `isLoading`, `files`, `error?`
  - Presentational components own only local UI state (if any)

  ## Interfaces
  ```ts
  type FileControlViewModel = {
    isLoading: boolean;
    files: string[];
    pickFolder: () => Promise<void>;
  };
  ```

  ## Acceptance Criteria

  - Clicking button opens folder picker.
  - Chosen path is persisted as cwd.
  - Files up to depth 2 are discovered and listed.
  - Loading state is visible and button disabled during processing.
  - Canceling picker makes no DB changes.
  - Errors are surfaced without app crash.

  ## File/Folder Layout

  src/features/file-control/
    FileControlContainer.tsx
    hooks/useFileControl.ts
    components/
      FileControl.tsx
      LoaderBar.tsx
      FileDisplayBar.tsx
    services/
      openFolderPicker.ts
      scanFilesTwoLevels.ts
      workspaceRepository.ts

  ## Notes

  - Keep all DB/filesystem calls out of presentational components.
  - If logic grows, move orchestration from hook into workspaceService.