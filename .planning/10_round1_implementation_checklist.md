# Round 1 Implementation Checklist

## Goal
Generate the first runnable app frame with Electron + renderer wiring, feature shells, state scaffolding, and placeholder backend integrations.

## Phase 0: Repo Structure
- [ ] Create folders: `electron/`, `renderer/`, `python/` (if missing).
- [ ] Ensure `.planning/features/` remains spec-only and not runtime-imported.
- [ ] Align actual tree with `03_folder_system.md`.

## Phase 1: Tooling + Scripts
- [ ] Configure root `package.json` scripts:
  - [ ] `dev`
  - [ ] `dev:renderer`
  - [ ] `dev:electron`
  - [ ] `typecheck`
  - [ ] `build`
  - [ ] `package`
- [ ] Add dev dependencies: `concurrently`, `wait-on`, `cross-env`.
- [ ] Configure TypeScript projects for `renderer` and `electron`.

## Phase 2: Electron Runtime Skeleton
- [ ] Implement `electron/main/index.ts` app bootstrap.
- [ ] Implement `electron/preload/index.ts` typed `window.api.*` bridge.
- [ ] Add placeholder IPC handlers:
  - [ ] `workspaceHandlers.ts`
  - [ ] `assessmentHandlers.ts`
  - [ ] `rubricHandlers.ts`
  - [ ] `chatHandlers.ts`
- [ ] Add DB skeleton:
  - [ ] `sqlite.ts`
  - [ ] repositories stubs
- [ ] Add services skeleton:
  - [ ] `fileScanner.ts`
  - [ ] `documentExtractor.ts`
  - [ ] `llmOrchestrator.ts`
  - [ ] `feedbackFileGenerator.ts`

## Phase 3: Renderer Frame + Layout
- [ ] Scaffold renderer app root (`main.tsx`, `App.tsx`).
- [ ] Build App shell from `07_layout_spec.md` regions:
  - [ ] `LoaderBar`
  - [ ] `FileDisplayBar`
  - [ ] `AssessmentWindow`
  - [ ] `ChatView`
  - [ ] `ChatInterface`
- [ ] Implement `AssessmentWindow` tab switching (`AssessmentTab` / `RubricTab`).
- [ ] Implement `AssessmentTab` 2-pane/3-pane shell.
- [ ] Implement `RubricTab` 2-pane shell.

## Phase 4: Global State Scaffolding
- [ ] Create `AppState` and reducer slices per `04_state_management.md`.
- [ ] Implement `AppStateProvider` and action dispatch wiring.
- [ ] Wire minimal selectors for shell-level rendering.

## Phase 5: Type Contracts
- [ ] Create `src/types/*` files from `05_typescript_interfaces.md`.
- [ ] Ensure file-kind mapping lowercases extensions before `FileKind` assignment.
- [ ] Add IPC result/error envelope types shared with preload API.

## Phase 6: Query + Notifications
- [ ] Add `QueryClientProvider`.
- [ ] Add React-Toastify container at app root.
- [ ] Hook first async action (`select folder`) through query/mutation + reducer update.

## Phase 7: First Workflow (Happy Path)
- [ ] Select folder -> persist cwd -> scan files -> populate file list.
- [ ] Click file -> render text in `OriginalTextView` (for `.docx`/`.pdf`) or show `ImageView`.
- [ ] Append system chat message in `ChatView`.

## Phase 8: Python Integration Baseline
- [ ] Implement Python worker spawn in main process.
- [ ] Add one test action (`llm.chat` or `llm.assessEssay`) using normalized envelopes.
- [ ] Return normalized success/error to renderer.

## Phase 9: Validation
- [ ] `npm run dev` launches renderer + Electron.
- [ ] HMR works in renderer while Electron is open.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` succeeds for renderer + electron.
- [ ] `npm run package` produces installable artifacts.

## Exit Criteria (Round 1 Done)
- [ ] App frame matches `07_layout_spec.md`.
- [ ] Theme/token scaffolding matches `09_styles_spec.md`.
- [ ] State wiring follows `04_state_management.md`.
- [ ] Feature shells exist for file-control, assessment-window, assessment-tab, rubric-tab.
- [ ] At least one end-to-end file workflow is operational.
