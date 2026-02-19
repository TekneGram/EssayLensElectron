# Phase 7 Report: AssessmentTab Composition + Prop-Driven Subfeatures

## Completed
- Implemented Phase 7 orchestration wiring so `AssessmentTab`, `OriginalTextView`, `CommentsView`, and the expanded `ChatInterface` now interact through explicit typed props/events.
- Kept `AssessmentTab.tsx` as orchestration/composition-only (no inline subcomponent definitions added).
- Preserved existing layout contract where `ChatInterface` remains mounted in `App` while receiving orchestrated state from `AssessmentTab`.

## Key Changes

### 1) AssessmentTab Orchestrator State + Rules
Updated `renderer/src/features/assessment-tab/components/AssessmentTab.tsx` to own and coordinate:
- `pendingSelection`
- `activeCommand`
- `chatMode`
- `activeCommentId`
- `isProcessCenterOpen`
- `draftText` (composer draft for ChatInterface composition contract)

Implemented chat mode rule behavior:
- default mode `comment`
- when command becomes active, mode forced to `chat`
- while command active, attempts to switch to `comment` are ignored
- when command clears, mode unlocks and returns to `comment` from `chat`

Also updated `CommentsView -> onSendToLlm` wiring to set `activeCommentId` and activate a dropdown-sourced command event.

### 2) Prop-Driven Bridge from AssessmentTab to ChatInterface
Because `ChatInterface` is mounted in `App` (outside `AssessmentWindow`), Phase 7 composition was implemented via a typed prop bridge:
- `AssessmentTab` now emits a typed chat binding object through optional `onChatBindingsChange`.
- `App` stores those bindings and passes them into `ChatInterface`.

Updated files:
- `renderer/src/features/assessment-tab/types.ts`
  - added `AssessmentTabChatBindings` alias
- `renderer/src/features/assessment-tab/components/AssessmentTab.tsx`
  - added optional `onChatBindingsChange`
  - publishes memoized chat bindings via `useEffect`
- `renderer/src/App.tsx`
  - stores bindings in local state
  - passes bindings into `ChatInterface`

This preserves `AssessmentTab` as orchestration boundary while keeping shell layout unchanged.

### 3) Phase 7 Test Coverage Added
Updated `renderer/src/features/assessment-tab/__tests__/AssessmentTabRouting.test.tsx` with a new test:
- verifies command selection in `OriginalTextView` propagates to `ChatInterface`
- verifies `chatMode` + lock state (`chat:true`) when command is active
- verifies comment-mode toggle is disabled while locked
- verifies clearing command via dropdown unlocks mode and reverts to `comment:false:no-command`

## Verification
- `npm run -s typecheck` (pass)
- `npx vitest run renderer/src/features/assessment-tab/__tests__/AssessmentTabRouting.test.tsx renderer/src/features/assessment-tab/__tests__/AssessmentTabResize.test.tsx renderer/src/features/layout/__tests__/ChatCollapse.test.tsx renderer/src/features/layout/__tests__/AppShell.test.tsx` (pass)

## Handoff
- Phase 7 scope is complete:
  - `AssessmentTab` now orchestrates shared workflow state and policies.
  - `OriginalTextView`, `CommentsView`, and `ChatInterface` exchange state/actions via explicit typed props/events.
  - Chat mode lock behavior is enforced at orchestration level.
- Phase 8 can focus on implementing `OriginalTextView` feature internals:
  - real selection capture and normalization into `PendingSelection`
  - process command center behavior/details
  - optional anchor/focus behavior for `activeCommentId`
