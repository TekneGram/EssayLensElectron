# Round 1 Testing Strategy (Lean Stack)

## Purpose
Define a practical testing strategy for Round 1 that is integrated with implementation phases and constrained to a lean toolchain.

## Round 1 Scope
In scope:
- Unit and component tests for renderer and Electron main/preload logic.
- Cross-layer integration tests for key workflows and IPC contracts.
- Minimal Electron end-to-end smoke coverage for critical paths.

Out of scope (defer to later rounds):
- Additional test frameworks beyond the lean stack.
- Broad accessibility automation tooling.
- Large DB harness expansion beyond critical-path behavior.

## Lean Stack (Required)
1. `vitest` (unit + integration runner).
2. `@testing-library/react` + `@testing-library/user-event` (renderer component behavior).
3. `playwright` with Electron (`_electron`) for minimal E2E.

## Test Architecture
Use a hybrid model:
- Co-located tests for fast feedback and maintainability.
- Root-level integration/E2E suites for cross-layer risks.

Primary paths:
- `renderer/src/features/**/__tests__/`
- `electron/main/**/__tests__/`
- `tests/integration/`
- `tests/e2e/`

## Naming Conventions
- Use `*.test.ts` for non-React tests.
- Use `*.test.tsx` for React/component tests.
- Keep integration tests explicit: `*.integration.test.ts` / `*.integration.test.tsx`.
- Keep E2E tests explicit: `*.e2e.ts`.

## Phase-Aligned Test Plan
1. Phase 1-2 (tooling + runtime skeleton)
- Script smoke checks and build-path checks.
- Main/preload unit tests for typed API and handler wiring.

2. Phase 3 (renderer frame + layout)
- Shell rendering tests and tab behavior tests.

3. Phase 4-6 (state + types + query)
- Reducer purity tests.
- Type/contract tests for result envelopes and file-kind normalization.
- Query success/failure integration tests (including error UI behavior).

4. Phase 7-8 (workflow + Python integration baseline)
- Integration tests for folder workflow and file-type routing.
- Main-process integration tests for Python response normalization and error mapping.

5. Phase 9 (validation)
- 1 happy-path Electron E2E.
- 1 critical-failure Electron E2E.
- Packaging smoke check for excluded test/spec/planning content.

## Minimum Required Coverage (Round 1)
- Folder select -> persist cwd -> scan -> render file list.
- Assessment/Rubric tab switching and visibility rules.
- Image/text routing in `AssessmentTab`.
- Error normalization path from main process to renderer-visible error states.
- One working end-to-end app flow.

## CI Gates
Each PR should pass:
1. `npm run typecheck`
2. Lean unit/component/integration suite (Vitest)
3. Minimal Electron E2E smoke (Playwright)
4. `npm run build`
5. Packaging smoke check (artifact excludes tests/specs/`.planning`)

Local agent execution policy:
- Agent outputs command lists for manual user execution of dev/prod/package checks.
- Agent does not run `npm run dev`, `npm run start:prod`, or packaging commands unless explicitly requested by the user.

## Maintenance Rules
- Feature changes must update nearby co-located tests.
- Cross-layer contract changes must update `tests/integration/`.
- Workflow/UI regressions that reach production must add or strengthen E2E coverage in `tests/e2e/`.
