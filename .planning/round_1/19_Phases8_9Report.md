# Phases 8 and 9 Report (Handoff for Phase 10)

## Purpose
Summarize what was achieved in Phase 8 (Python Integration Baseline) and Phase 9 (Basic Style Implementation), plus the immediate layout/style refinements completed after Phase 9 to keep specs aligned with runtime behavior.

## Phase 8 Goal (From Checklist)
- Implement Python worker spawn in main process.
- Add one test action (`llm.chat` or `llm.assessEssay`) using normalized envelopes.
- Return normalized success/error to renderer.
- Add tests for request/response normalization, `requestId` correlation, and error mapping.

## What Was Achieved in Phase 8

### 1) Python bridge protocol contracts were introduced
Added shared request/response contracts for main-process Python transport and typed chat payload/result contracts.

New files:
- `electron/shared/llmContracts.ts`
- `electron/shared/chatContracts.ts`

### 2) Python worker process client was implemented in Electron main
Implemented worker spawn + lifecycle + line-delimited JSON transport + pending request correlation + timeout handling.

New file:
- `electron/main/services/pythonWorkerClient.ts`

Behavior includes:
- spawn via `python3 -u <worker>` (configurable by env)
- one-request/one-response matching by `requestId`
- malformed envelope/JSON handling
- process-down handling
- timeout handling

### 3) LLM orchestration now normalizes worker outcomes to canonical error codes
Replaced placeholder orchestrator with worker-backed orchestration and normalized failure mapping.

Updated file:
- `electron/main/services/llmOrchestrator.ts`

Canonical mapped codes:
- `PY_TIMEOUT`
- `PY_PROCESS_DOWN`
- `PY_INVALID_RESPONSE`
- `PY_ACTION_FAILED`

### 4) `chat/sendMessage` is now a real IPC action path
`chatHandlers` now validates payload, calls `llm.chat`, persists teacher+assistant records, and returns normalized `AppResult`.

Updated files:
- `electron/main/ipc/chatHandlers.ts`
- `electron/main/db/repositories/chatRepository.ts`
- `electron/preload/apiTypes.ts`
- `electron/preload/index.ts`
- `electron/preload/__tests__/index.test.ts`

### 5) Phase-8 tests were added
New tests:
- `electron/main/services/__tests__/pythonWorkerClient.test.ts`
- `electron/main/services/__tests__/llmOrchestrator.test.ts`
- `electron/main/ipc/__tests__/chatHandlers.test.ts`

Coverage includes:
- request correlation under out-of-order responses
- invalid JSON/envelope handling
- timeout/process-down mapping
- `requestId` mismatch mapping
- chat handler success/failure integration behavior

## Phase 9 Goal (From Checklist)
- Align renderer styling with mockup visual baseline.
- Port token/theme intent and pane-level styling.
- Preserve existing behavior and accessibility semantics.

## What Was Achieved in Phase 9

### 1) Global style layers were upgraded to match mockup intent
Updated tokenized themes, app background, macro layout seams, pane styling, tabs, file list, chat surfaces, and interaction affordances.

Updated files:
- `renderer/src/styles/themes.css`
- `renderer/src/styles/base.css`
- `renderer/src/styles/layout.css`
- `renderer/src/styles/components.css`

### 2) Component markup was aligned with style hooks
Updated class structure to match the style system while preserving behavior/test IDs.

Updated files:
- `renderer/src/features/layout/components/LoaderBar.tsx`
- `renderer/src/features/layout/components/FileDisplayBar.tsx`
- `renderer/src/features/layout/components/ChatView.tsx`
- `renderer/src/features/layout/components/ChatInterface.tsx`
- `renderer/src/features/assessment-window/components/AssessmentWindow.tsx`
- `renderer/src/features/assessment-tab/components/AssessmentTab.tsx`
- `renderer/src/features/rubric-tab/components/RubricTab.tsx`
- `renderer/src/main.tsx`

### 3) Focused style-structure assertions were added
Updated tests to verify active tab class hooks and preserve behavior during style refactor.

Updated tests:
- `renderer/src/features/assessment-window/__tests__/AssessmentWindowTabs.test.tsx`

## Post-Phase-9 Layout/Style Refinements (Completed)
These were completed immediately after Phase 9 and are now part of the current baseline.

### A) Comments and rubric pane vertical fill behavior
- `RubricSelectionView` and `RubricView` now stretch fully to bottom of `AssessmentWindow`.
- In `CommentsView`, tabs are fixed at top and tabpanel content stretches/scrolls to the bottom.

### B) Collapsible right-side ChatView with persistent ChatInterface
- `ChatView` can collapse into a thin rail (`8px`) and be expanded from rail.
- `ChatInterface` always remains visible.
- Chat intent in `ChatInterface` auto-expands `ChatView`.

State and behavior files:
- `renderer/src/types/state.ts`
- `renderer/src/state/actions.ts`
- `renderer/src/state/initialState.ts`
- `renderer/src/state/reducers.ts`
- `renderer/src/state/selectors.ts`
- `renderer/src/App.tsx`
- `renderer/src/features/layout/components/ChatCollapsedRail.tsx`
- `renderer/src/features/layout/components/ChatView.tsx`
- `renderer/src/features/layout/components/ChatInterface.tsx`

### C) Resizable two-pane split in AssessmentTab
- Added draggable/keyboard splitter between `OriginalTextView` and `CommentsView` in two-pane mode.
- Split ratio stored in UI reducer and clamped.
- Three-pane image mode remains unchanged.

Files:
- `renderer/src/features/assessment-tab/components/AssessmentTab.tsx`
- `renderer/src/styles/layout.css`
- `renderer/src/styles/components.css`
- `renderer/src/state/*` (ratio action/state/reducer/selectors)

Tests:
- `renderer/src/features/layout/__tests__/ChatCollapse.test.tsx`
- `renderer/src/features/assessment-tab/__tests__/AssessmentTabResize.test.tsx`
- `renderer/src/state/__tests__/uiReducer.test.ts`

## Current Validation Status
Verified after Phase 8 + Phase 9 + subsequent layout/style refinements:
- `npm run typecheck` passes.
- `npm run test` passes.
- Test suite green across Electron + renderer, including new bridge/layout/resize coverage.

## Architectural Notes
- Main-process boundary discipline is maintained:
  - renderer talks only through typed `window.api`.
  - Python orchestration and normalization remain in Electron main.
- Query/reducer split remains intact:
  - Query handles async workflows.
  - reducers remain canonical UI/session state.
- Layout/state enhancements are reducer-driven (`ui` slice), not local component-only state.

## What Is Still Deferred (Expected)
- Real Python worker runtime implementation under `python/` is still pending in this repo.
- `assessment/requestLlmAssessment` remains placeholder-level in IPC handlers.
- Full chat send/read renderer workflow is still basic UI scaffolding.
- Production packaging/manual validation remains a user-run phase-gate step.

## Risks / Watchouts For Phase 10
1. Thin-rail usability
- Keep expand affordance keyboard-focusable and discoverable.

2. Splitter interaction edge cases
- Verify pointer behavior in high-DPI/zoom and narrow viewport conditions.

3. Style-token drift
- Keep new component styles token-driven and avoid introducing ad-hoc colors.

4. Python runtime readiness
- Ensure packaged app has worker path/process assumptions validated before release.

## Suggested Start Point For Phase 10
1. Run manual phase-gate checks (`dev`, `build`, `start:prod`, `package`).
2. Perform visual QA on chat collapse/expand and split-resize interactions.
3. Add one Electron E2E happy-path and one failure-path flow per checklist.

## Phase Gate Manual Verification Commands (User Run)
1. `npm run dev`
2. `npm run build`
3. `npm run start:prod`
4. `npm run package` (or `npm run package:dir`)
