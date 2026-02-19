# Phase 6 Report: Frontend Data Wiring (TanStack + State)

## Completed
- Implemented Phase 6 renderer data wiring for assessment feedback list/add flows.
- Wired selected-file feedback loading into `AssessmentTab`.
- Added renderer-side assessment API wrappers and TanStack hooks.
- Updated assessment tab tests to include assessment API stubs under the new wiring.

## Renderer API Wrappers Added
- `renderer/src/features/assessment-tab/hooks/feedbackApi.ts`
  - `listFeedback(fileId)` calls preload `assessment/listFeedback` and returns feedback array.
  - `addFeedback(request)` calls preload `assessment/addFeedback` and returns created feedback.
  - Both wrappers normalize IPC failure into thrown `Error` for query/mutation handling.

## TanStack Hooks Added
- `renderer/src/features/assessment-tab/hooks/useFeedbackListQuery.ts`
  - Runs file-scoped query keyed by `['assessment', 'feedback', fileId]`.
  - Enabled only when `selectedFileId` exists.
  - Dispatches reducer updates:
    - loading: `feedback/setStatus`, clear error
    - success: `feedback/setForFile`, `feedback/setStatus=idle`, clear error
    - error: `feedback/setStatus=error`, `feedback/setError`
  - Toastifies list errors once per error update.

- `renderer/src/features/assessment-tab/hooks/useAddFeedbackMutation.ts`
  - Adds file-scoped feedback mutation.
  - Accepts add-feedback payload without `fileId`; injects current `selectedFileId`.
  - Dispatches reducer updates:
    - onMutate: `feedback/setStatus=loading`, clear error
    - onSuccess: `feedback/add`, `feedback/setStatus=idle`, clear error
    - onError: `feedback/setStatus=error`, `feedback/setError`
  - Invalidates the file feedback list query on success.

- `renderer/src/features/assessment-tab/hooks/queryKeys.ts`
  - Shared query-key builder for assessment feedback list.

- `renderer/src/features/assessment-tab/hooks/index.ts`
  - Barrel export for assessment feedback hooks.

## AssessmentTab Integration
- Updated `renderer/src/features/assessment-tab/components/AssessmentTab.tsx`:
  - Calls `useFeedbackListQuery(selectedFileId)` so file selection triggers real feedback load/refetch.
  - Initializes `useAddFeedbackMutation(selectedFileId)` to wire mutation lifecycle status into UI state.
  - Uses mutation/query-driven status/error via reducer-backed `feedback` slice for `CommentsView`.

## Test Updates
- Updated API stubs in:
  - `renderer/src/features/assessment-tab/__tests__/AssessmentTabRouting.test.tsx`
  - `renderer/src/features/assessment-tab/__tests__/AssessmentTabResize.test.tsx`
- Added mocked `assessment.listFeedback` and `assessment.addFeedback` so tests remain valid with the new query wiring.
- Routing test now asserts `listFeedback` is called with selected file id.

## Verification
- `npm run -s typecheck` (pass)
- `npx vitest run renderer/src/features/assessment-tab/__tests__/AssessmentTabRouting.test.tsx renderer/src/features/assessment-tab/__tests__/AssessmentTabResize.test.tsx renderer/src/features/file-control/__tests__/FileControlContainer.test.tsx` (pass)

## Handoff
- Phase 6 scope is complete:
  - Selected-file feedback now loads from real assessment IPC list endpoint through TanStack + reducer dispatch.
  - Add-feedback mutation flow is implemented and cache-invalidating, ready for submit wiring.
- Phase 7 can focus on orchestration composition and prop-driven integration between:
  - `AssessmentTab`
  - `OriginalTextView`
  - `CommentsView`
  - expanded `ChatInterface`
