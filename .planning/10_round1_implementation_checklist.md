# Round 1 Implementation Checklist

## Goal
Generate the first runnable app frame with Electron + renderer wiring, feature shells, state scaffolding, and placeholder backend integrations.

Global reference rule:
- For every phase, load `12_testing_strategy.md` first to apply consistent Lean Round 1 testing scope, naming, and folder conventions.

## Phase 0: Repo Structure
- [ ] Create folders: `electron/`, `renderer/`, `python/` (if missing).
- [ ] Create test folders:
  - [ ] co-located unit/integration folders: `renderer/src/features/**/__tests__/`, `electron/main/**/__tests__/`
  - [ ] cross-layer suites: `tests/integration/`, `tests/e2e/`
- [ ] Ensure `.planning/features/` remains spec-only and not runtime-imported.
- [ ] Align actual tree with `03_folder_system.md`.

References:
- `03_folder_system.md`
- `00_app_architecture_spec.md`
- `12_testing_strategy.md`
- `features/01_file-control.md`
- `features/02_assessment_window_tabs_spec.md`
- `features/03_assessment-tab.md`
- `features/04_rubric-tab.md`
- `features/05_assessment-pane-resize.md`

## Phase 1: Tooling + Scripts
- [ ] Configure root `package.json` scripts:
  - [ ] `dev`
  - [ ] `dev:renderer`
  - [ ] `dev:electron`
  - [ ] `start:prod`
  - [ ] `typecheck`
  - [ ] `build`
  - [ ] `package`
  - [ ] `package:dir`
- [ ] Add dev dependencies: `concurrently`, `wait-on`, `cross-env`.
- [ ] Add testing dependencies (Lean Round 1):
  - [ ] `vitest`
  - [ ] `@testing-library/react`
  - [ ] `@testing-library/user-event`
  - [ ] `playwright`
- [ ] Configure TypeScript projects for `renderer` and `electron`.
- [ ] Add build-only tsconfigs:
  - [ ] `renderer/tsconfig.build.json`
  - [ ] `electron/tsconfig.build.json`
- [ ] Exclude non-runtime files in build tsconfigs:
  - [ ] `**/*.test.*`, `**/*.spec.*`, `**/__tests__/**`, `**/tests/**`, `.planning/**`
- [ ] Ensure build scripts use build tsconfigs for production compile.
- [ ] Configure `electron-builder` allowlist/denylist patterns:
  - [ ] include runtime outputs/resources only (`renderer/dist`, electron dist, required python runtime files)
  - [ ] exclude tests/specs/docs and `.planning/**`
- [ ] Exclude Python test/dev-only assets from packaged app resources.
- [ ] Test track:
  - [ ] Add script smoke-check command list for `dev`, `build`, and `package` wiring (manual user run; agent does not execute).
  - [ ] Verify production compile path does not include test/spec/planning files.
  - [ ] Output `npm run start:prod` manual verification command for user run (after `npm run build`).

References:
- `03_folder_system.md`
- `00_app_architecture_spec.md`
- `12_testing_strategy.md`
- `10_round1_implementation_checklist.md`

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
- [ ] Test track:
  - [ ] Add main/preload unit tests for typed `window.api.*` surface and IPC handler registration.
  - [ ] Add smoke test that main process can boot without renderer crashes.

References:
- `00_app_architecture_spec.md`
- `03_folder_system.md`
- `01_database_plan.md`
- `06_python_backend_integration_spec.md`
- `05_typescript_interfaces.md`
- `12_testing_strategy.md`

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
- [ ] Test track:
  - [ ] Add component tests for shell region rendering (`LoaderBar`, `FileDisplayBar`, `AssessmentWindow`, `ChatView`, `ChatInterface`).
  - [ ] Add tab-switch tests (default tab, click behavior, inactive panel hidden, `aria-selected` correctness).
  - [ ] Phase gate (required from this phase onward):
    - [ ] Agent outputs manual verification commands for user run:
      - [ ] `npm run dev`
      - [ ] `npm run build`
      - [ ] `npm run start:prod`
      - [ ] `npm run package` (or `npm run package:dir` for faster local check)

References:
- `12_testing_strategy.md`
- `00_app_architecture_spec.md`
- `03_folder_system.md`
- `07_layout_spec.md`
- `09_styles_spec.md`
- `02_broad_component_hierarchy.md`
- `features/02_assessment_window_tabs_spec.md`
- `features/03_assessment-tab.md`
- `features/04_rubric-tab.md`
- `features/05_assessment-pane-resize.md`

## Phase 4: Global State Scaffolding
- [ ] Create `AppState` and reducer slices per `04_state_management.md`.
- [ ] Implement `AppStateProvider` and action dispatch wiring.
- [ ] Wire minimal selectors for shell-level rendering.
- [ ] Test track:
  - [ ] Add reducer unit tests for each slice.
  - [ ] Verify reducers stay pure and side-effect free.
  - [ ] Phase gate (required): output manual verification commands for `dev`, `build`, `start:prod`, and `package`/`package:dir` (user runs them).

References:
- `04_state_management.md`
- `05_typescript_interfaces.md`
- `00_app_architecture_spec.md`
- `12_testing_strategy.md`

## Phase 5: Type Contracts
- [ ] Create `src/types/*` files from `05_typescript_interfaces.md`.
- [ ] Ensure file-kind mapping lowercases extensions before `FileKind` assignment.
- [ ] Add IPC result/error envelope types shared with preload API.
- [ ] Test track:
  - [ ] Add type-level/unit checks for file-kind mapping normalization.
  - [ ] Add contract tests for `AppResult` success/failure envelope handling.
  - [ ] Phase gate (required): output manual verification commands for `dev`, `build`, `start:prod`, and `package`/`package:dir` (user runs them).

References:
- `05_typescript_interfaces.md`
- `00_app_architecture_spec.md`
- `06_python_backend_integration_spec.md`
- `01_database_plan.md`
- `03_folder_system.md`
- `12_testing_strategy.md`

## Phase 6: Query + Notifications
- [ ] Add `QueryClientProvider`.
- [ ] Add React-Toastify container at app root.
- [ ] Hook first async action (`select folder`) through query/mutation + reducer update.
- [ ] Test track:
  - [ ] Add container/hook integration tests for query success -> reducer dispatch.
  - [ ] Add failure-path tests for concise error state + Toastify notification behavior.
  - [ ] Phase gate (required): output manual verification commands for `dev`, `build`, `start:prod`, and `package`/`package:dir` (user runs them).

References:
- `12_testing_strategy.md`
- `04_state_management.md`
- `00_app_architecture_spec.md`
- `05_typescript_interfaces.md`
- `03_folder_system.md`
- `07_layout_spec.md`
- `09_styles_spec.md`
- `features/01_file-control.md`

## Phase 7: First Workflow (Happy Path)
- [ ] Select folder -> persist cwd -> scan files -> populate file list.
- [ ] Click file -> render text in `OriginalTextView` (for `.docx`/`.pdf`) or show `ImageView`.
- [ ] Append system chat message in `ChatView`.
- [ ] Test track:
  - [ ] Add integration tests for folder picker cancel/no-op and success path persistence + file listing.
  - [ ] Add integration tests for file selection routing (`ImageView` vs `OriginalTextView`).
  - [ ] Phase gate (required): output manual verification commands for `dev`, `build`, `start:prod`, and `package`/`package:dir` (user runs them).

References:
- `12_testing_strategy.md`
- `00_app_architecture_spec.md`
- `features/01_file-control.md`
- `features/02_assessment_window_tabs_spec.md`
- `features/03_assessment-tab.md`
- `07_layout_spec.md`
- `09_styles_spec.md`
- `04_state_management.md`
- `03_folder_system.md`

## Phase 8: Python Integration Baseline
- [ ] Implement Python worker spawn in main process.
- [ ] Add one test action (`llm.chat` or `llm.assessEssay`) using normalized envelopes.
- [ ] Return normalized success/error to renderer.
- [ ] Test track:
  - [ ] Add main-process integration tests for request/response normalization and `requestId` correlation.
  - [ ] Add error mapping tests (`PY_TIMEOUT`, `PY_PROCESS_DOWN`, `PY_INVALID_RESPONSE`, `PY_ACTION_FAILED`).
  - [ ] Phase gate (required): output manual verification commands for `dev`, `build`, `start:prod`, and `package`/`package:dir` (user runs them).

References:
- `12_testing_strategy.md`
- `06_python_backend_integration_spec.md`
- `00_app_architecture_spec.md`
- `03_folder_system.md`
- `05_typescript_interfaces.md`

## Phase 9: Validation
- [ ] User runs `npm run dev` manually to confirm renderer + Electron launch.
- [ ] User confirms HMR works in renderer while Electron is open.
- [ ] `npm run typecheck` passes.
- [ ] User runs `npm run build` manually and confirms renderer + electron success.
- [ ] User runs `npm run start:prod` manually against built production assets.
- [ ] User runs `npm run package` manually and confirms installable artifacts.
- [ ] Packaging smoke check verifies final artifact does not contain:
  - [ ] `**/*.test.*`, `**/*.spec.*`, `**/__tests__/**`, `**/tests/**`, `.planning/**`
- [ ] Test track:
  - [ ] Add at least one Electron E2E happy-path flow (`select folder -> open file -> visible workspace updates`).
  - [ ] Add one critical-failure E2E flow (example: backend error surfaced without app crash).
- [ ] Lean Round 1 scope check:
  - [ ] Only Vitest + Testing Library + Playwright are required in this round.
  - [ ] Additional test tooling is deferred to later rounds.

References:
- `03_folder_system.md`
- `10_round1_implementation_checklist.md`
- `12_testing_strategy.md`
- `07_layout_spec.md`
- `09_styles_spec.md`
- `04_state_management.md`

## Exit Criteria (Round 1 Done)
- [ ] App frame matches `07_layout_spec.md`.
- [ ] Theme/token scaffolding matches `09_styles_spec.md`.
- [ ] State wiring follows `04_state_management.md`.
- [ ] Feature shells exist for file-control, assessment-window, assessment-tab, rubric-tab.
- [ ] At least one end-to-end file workflow is operational.
