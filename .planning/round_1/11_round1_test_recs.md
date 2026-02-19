# Round 1 Test Recommendations

Based on the planning docs in `.planning/` and `.planning/features/` (excluding `rubric-design/`), these are the high-value tests to create.

## Feature Tests

| Feature | Important tests to add |
|---|---|
| `features/01_file-control.md` | Picker click triggers folder dialog; cancel returns no-op with no DB writes; selected folder persists as CWD; scanner only returns depth `<=2`; files persist and render; loading state disables trigger; scan/persist failure clears loading and surfaces error without crash. |
| `features/02_assessment_window_tabs_spec.md` | Default tab is `assessment`; clicking tabs switches visible panel; inactive panel hidden; `aria-selected` updates; keyboard Left/Right + Enter/Space works; switching tabs preserves AssessmentTab local layout state. |
| `features/03_assessment-tab.md` | `image` file type enables 3-pane layout and shows `ImageView`; `docx/pdf` show text in `OriginalTextView`; `CommentsView` always visible; comments sub-tab switches single visible panel; pane mode flips correctly on file-type changes. |
| `features/04_rubric-tab.md` | With rubric tab active, both panels render; wide viewport is side-by-side; narrow viewport stacks in correct order (`selection` then `rubric`); component remains presentational (no fetch/persist side effects). |
| `features/05_assessment-pane-resize.md` | 2-pane drag resizes adjacent panes with min clamps; 3-pane dual divider behavior; crossing threshold collapses pane; reopen handle restores `lastOpenPct`/`minPct`; separator keyboard resizing works; resize math keeps visible panes normalized (sum ~100). |

## Architecture and App-Wide Tests

| Area | Important tests to add |
|---|---|
| `00_app_architecture_spec.md`, `04_state_management.md` | Reducers are pure and side-effect free; action unions update correct slices; query success maps to reducer dispatch; query failures set concise error state and trigger toast. |
| `06_python_backend_integration_spec.md` | Main starts/stops Python worker; request/response `requestId` matching; timeout maps to `PY_TIMEOUT`; malformed payload maps to `PY_INVALID_RESPONSE`; unknown action rejected; renderer never sees raw Python envelope. |
| `03_folder_system.md` | Renderer cannot directly access DB/Python modules; preload exposes only typed `window.api.*`; `.planning/` is never runtime-imported; script contracts (`dev`, `build`, `package`) work in CI smoke tests. |
| `01_database_plan.md` | Schema migration creates all tables; FK constraints enforced; CHECK constraints enforced; unique index `idx_unique_instance_detail` enforced; critical repository CRUD paths for workspace/files/chat/feedback/rubric. |
| `05_typescript_interfaces.md` | File extension mapping lowercases before `FileKind`; IPC result envelope narrows correctly (`ok: true/false`); invalid payloads rejected at boundary validation layer. |
| `07_layout_spec.md`, `09_styles_spec.md` | Shell region presence (`LoaderBar`, `FileDisplayBar`, `AssessmentWindow`, `ChatView`, `ChatInterface`); responsive behavior at breakpoints; theme toggle persistence; focus ring visibility and semantic accessibility checks. |
| `10_round1_implementation_checklist.md` | One E2E happy path: select folder -> file list -> open doc/image -> chat/system message appears; plus build/typecheck/package manual smoke-check commands for user execution. |

## Recommended Testing Suite

1. `Vitest` for unit + integration (fast TS-native runner).
2. `@testing-library/react` + `@testing-library/user-event` for renderer behavior.
3. `Playwright` (Electron mode via `_electron`) for desktop E2E flows.
4. `Vitest` in Node environment for Electron main/preload unit tests.

## Deferred Beyond Lean Round 1

- Dedicated accessibility tooling (`jest-axe` / `axe-core`).
- Expanded DB/repository test harnesses beyond critical-path integration coverage.
- Additional test frameworks outside the core stack above.
