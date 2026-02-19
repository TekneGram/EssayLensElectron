# Round 2 Phased Design

## Mini-Spec: Assessment Sub-Features (v1)

### 1. Scope
1. Support teacher workflow: highlight text in docx -> compose/send comment via ChatInterface -> show/manage comments in CommentsView.
2. Keep `AssessmentTab` as orchestrator for cross-component state.
3. Use existing `FeedbackItem` union shape for comment records.

### 2. Shared Domain Types (UI-facing)
```ts
type Mode = 'comment' | 'chat';
type CommandId = string; // e.g. 'evaluate-thesis', 'check-hedging'

type PendingSelection = {
  exactQuote: string;
  prefixText: string;
  suffixText: string;
  startAnchor: FeedbackAnchor;
  endAnchor: FeedbackAnchor;
};

type ActiveCommand = {
  id: CommandId;
  label: string;
  source: 'process-center' | 'chat-dropdown';
};

type UICommentDraft = {
  text: string;
  mode: Mode;
};
```

### 3. AssessmentTab (orchestrator)
Responsibilities:
1. Own cross-pane state and policies.
2. Pass data/actions to `OriginalTextView`, `CommentsView`, `ChatInterface`.
3. Coordinate selection -> chat draft -> comment creation.

State owned here:
1. `pendingSelection: PendingSelection | null`
2. `activeCommand: ActiveCommand | null`
3. `chatMode: 'comment' | 'chat'` with rule-based locking
4. `activeCommentId: string | null`
5. `isProcessCenterOpen: boolean`

Data fetched here (TanStack):
1. `commentsQuery` for selected file feedback list.
2. `addCommentMutation`
3. `editCommentMutation`
4. `deleteCommentMutation`
5. `applyCommentMutation`
6. `sendToLlmMutation`

### 4. OriginalTextView
Contains `TextViewWindow` + collapsible `ProcessCommandCenter`.

Responsibilities:
1. Render docx content.
2. Capture and emit text selection anchors/quote context.
3. Emit command selections from ProcessCommandCenter.

Inputs:
1. `selectedFileId`
2. `pendingSelection`
3. `activeCommentId` (optional for focus/jump behavior)
4. `isProcessCenterOpen`

Outputs:
1. `onSelectionCaptured(selection: PendingSelection | null)`
2. `onCommandSelected(command: ActiveCommand)`
3. `onToggleProcessCenter(open: boolean)`

### 5. CommentsView
Contains list of `CommentView`; each `CommentView` has `CommentHeader`, `CommentBody`, `CommentTools`.

Responsibilities:
1. Display comments for current file.
2. Allow edit/delete/send-to-LLM/apply actions.
3. Emit row selection for focus in text viewer.

Inputs:
1. `comments: FeedbackItem[]`
2. `activeCommentId`
3. `isLoading`
4. `error`

Outputs:
1. `onSelectComment(commentId: string)`
2. `onEditComment(commentId: string, nextText: string)`
3. `onDeleteComment(commentId: string)`
4. `onSendToLlm(commentId: string, command?: CommandId)`
5. `onApplyComment(commentId: string, applied: boolean)`

Rendering rules:
1. `CommentHeader`: title (fallback generated title if none).
2. `CommentBody`: truncated `exactQuote` when inline; always show comment text.
3. `CommentTools`: edit, delete, send to LLM, apply toggle.

### 6. ChatInterface
Contains `CommandDisplay`, `HighlightedTextDisplay`, `ChatInput`, `CommandDropdown`, `ChatToggle`.

Responsibilities:
1. Compose and send either comment or chat messages.
2. Display currently selected command and highlighted quote context.
3. Enforce mode lock rules.

Inputs:
1. `activeCommand`
2. `pendingSelection`
3. `chatMode`
4. `isModeLockedToChat`
5. `draftText`

Outputs:
1. `onDraftChange(text: string)`
2. `onSubmit()`
3. `onModeChange(mode: 'comment' | 'chat')`
4. `onCommandSelected(command: ActiveCommand | null)`

Mode rules:
1. Default mode is `comment`.
2. If `activeCommand != null`, auto-switch to `chat` and lock toggle.
3. While locked, user cannot switch to `comment`.
4. If command is cleared, unlock toggle; user may switch freely.

### 7. Cross-Component Interaction Rules
1. New selection in `TextViewWindow` updates `pendingSelection`; ChatInterface shows truncated quote.
2. Submitting in `comment` mode creates `FeedbackItem`:
   - inline if `pendingSelection` exists
   - block if `pendingSelection` is null
3. Successful create updates comments list and clears draft.
4. Selecting a comment in CommentsView can request TextView focus when anchors exist.
5. `apply` writes boolean state and updates comment row immediately (optimistic or refetch).

### 8. Persistence/API Contract Expectations
1. `listFeedback(fileId)` returns `FeedbackItem[]`.
2. `addFeedback(request)` accepts block/inline union.
3. `editFeedback`, `deleteFeedback`, `applyFeedback`, `sendFeedbackToLlm` endpoints should be explicit (or routed through assessment/chat channels consistently).

### 9. Acceptance Criteria (v1)
1. Teacher can highlight text and see selection context in ChatInterface.
2. Teacher can submit a comment and see it appear in CommentsView.
3. Teacher can edit/delete/apply/send-to-LLM from CommentTools.
4. Chat toggle behavior matches lock rules exactly.
5. No direct coupling between component internals; communication is via props/events only.

## File Organization Guardrails
1. `AssessmentTab.tsx` must remain orchestration-only; no nested component definitions in this file.
2. Parent composition files (`AssessmentTab.tsx`, `ChatInterface.tsx`) should stay under ~200 lines; if exceeded, split immediately.
3. Each major UI unit must live in its own file; no inline `function XView()` declarations inside parent feature files.
4. Use feature folders and barrel exports so new contexts can discover structure quickly.
5. `AssessmentTab` is the cross-component orchestration boundary; shared workflow state must be owned there (or in its container hook).
6. Child components must coordinate via typed props and callbacks only.
7. Child components must not directly read/write sibling-owned state or duplicate shared workflow state (`pendingSelection`, `activeCommand`, `chatMode`, `activeCommentId`).

Target structure:
- `renderer/src/features/assessment-tab/components/AssessmentTab.tsx`
- `renderer/src/features/assessment-tab/components/OriginalTextView/OriginalTextView.tsx`
- `renderer/src/features/assessment-tab/components/OriginalTextView/TextViewWindow.tsx`
- `renderer/src/features/assessment-tab/components/OriginalTextView/ProcessCommandCenter.tsx`
- `renderer/src/features/assessment-tab/components/CommentsView/CommentsView.tsx`
- `renderer/src/features/assessment-tab/components/CommentsView/CommentView.tsx`
- `renderer/src/features/assessment-tab/components/CommentsView/CommentHeader.tsx`
- `renderer/src/features/assessment-tab/components/CommentsView/CommentBody.tsx`
- `renderer/src/features/assessment-tab/components/CommentsView/CommentTools.tsx`
- `renderer/src/features/layout/components/ChatInterface/ChatInterface.tsx`
- `renderer/src/features/layout/components/ChatInterface/CommandDisplay.tsx`
- `renderer/src/features/layout/components/ChatInterface/HighlightedTextDisplay.tsx`
- `renderer/src/features/layout/components/ChatInterface/CommandDropdown.tsx`
- `renderer/src/features/layout/components/ChatInterface/ChatInput.tsx`
- `renderer/src/features/layout/components/ChatInterface/ChatToggle.tsx`

---

## Phase 0: Boundary + Interface Freeze
Goal: Lock component boundaries and event contracts before implementation.

- [ ] Create `AssessmentTab` orchestration contract doc in `.planning/` with final event names and ownership rules.
- [ ] Define concrete TypeScript interfaces for subfeatures:
  - [ ] `renderer/src/features/assessment-tab/types.ts` (or equivalent) containing:
    - [ ] `PendingSelection`
    - [ ] `ActiveCommand`
    - [ ] `ChatMode`
    - [ ] `OriginalTextViewProps`
    - [ ] `CommentsViewProps`
    - [ ] `CommentViewProps`
    - [ ] `CommentHeaderProps`
    - [ ] `CommentBodyProps`
    - [ ] `CommentToolsProps`
    - [ ] `ChatInterfaceProps` (expanded)
- [ ] Add compile-time “usage stubs” in `AssessmentTab` and related components so all interfaces are imported and typechecked.
- [ ] Phase output: all component props exist and compile; behavior still placeholder.

References:
- `.planning/10_Round2_phased_design.md`
- `.planning/04_state_management.md`
- `.planning/05_typescript_interfaces.md`

## Phase 0.5: Refactor Folder Organization
Goal: Refactor existing long component files into the target folder layout before Phase 1+ feature work.

- [ ] Split `renderer/src/features/assessment-tab/components/AssessmentTab.tsx` so it contains orchestration only.
- [ ] Move `OriginalTextView`-related UI into `renderer/src/features/assessment-tab/components/OriginalTextView/*`.
- [ ] Move `CommentsView`-related UI into `renderer/src/features/assessment-tab/components/CommentsView/*`.
- [ ] Move `ChatInterface` subcomponents into `renderer/src/features/layout/components/ChatInterface/*`.
- [ ] Add local `index.ts` barrel exports in each new component folder.
- [ ] Update imports in parent files to use the new folder structure.
- [ ] Add a lightweight lint/config guard (or checklist gate) for max-lines and no inline subcomponent definitions in parent composition files.
- [ ] Phase output: feature folders are normalized and parent files are small orchestration shells.

References:
- `.planning/10_Round2_phased_design.md`
- `.planning/04_state_management.md`
- `.planning/05_typescript_interfaces.md`
- `renderer/src/features/assessment-tab/components/AssessmentTab.tsx`
- `renderer/src/features/layout/components/ChatInterface.tsx`

## Phase 1: Shared Contracts First (Renderer/Main Boundary)
Goal: Establish stable DTO Request/Response contracts for assessment feedback.

- [ ] Add `electron/shared/assessmentContracts.ts` with:
  - [ ] `FeedbackAnchorDto`
  - [ ] `FeedbackDto` union (inline/block)
  - [ ] `ListFeedbackRequest`, `ListFeedbackResponse`
  - [ ] `AddFeedbackRequest`, `AddFeedbackResponse`
  - [ ] `EditFeedbackRequest/Response` (if included now)
  - [ ] `DeleteFeedbackRequest/Response` (if included now)
  - [ ] `ApplyFeedbackRequest/Response` (if included now)
  - [ ] `SendFeedbackToLlmRequest/Response` (if included now)
- [ ] Align renderer-facing command/types with shared contracts (no duplicate divergent shapes).
- [ ] Ensure preload `apiTypes.ts` uses new assessment contract names.
- [ ] Phase output: typed contract surface complete with no `unknown` for assessment feedback endpoints intended for Round 2.

References:
- `.planning/10_Round2_phased_design.md`
- `.planning/05_typescript_interfaces.md`

## Phase 2: API Boundary Validation Rules
Goal: Enforce strict input rules at IPC boundary before DB work.

- [ ] Implement validation/normalization helpers in `electron/main/ipc/assessmentHandlers.ts`:
  - [ ] validate `fileId` and required scalar fields
  - [ ] validate `kind` and `source`
  - [ ] inline requires `exactQuote`, `prefixText`, `suffixText`, `startAnchor`, `endAnchor`
- [ ] block rejects anchor/quote fields
- [ ] anchor fields are integer and `>= 0`
- [ ] optional anchor-order guard (start <= end)
- [ ] Return normalized `AppError` codes for invalid payloads.
- [ ] Phase output: assessment handlers reject malformed requests consistently, before repository execution.

References:
- `.planning/10_Round2_phased_design.md`
- `.planning/05_typescript_interfaces.md`
- `.planning/01_database_plan.md`

## Phase 3: DB Schema + Migration for Feedback Anchors
Goal: Persist feedback in normalized tables with anchor support.

- [ ] Create migration SQL for:
  - [ ] `feedback` table shape aligned to contract
  - [ ] `feedback_anchor` table (`start`/`end`)
  - [ ] required indexes (`entity_uuid`, anchor lookup indexes)
- [ ] Add constraints for immediate invariants:
  - [ ] allowed `kind` and `source`
  - [ ] valid `anchor_kind` in `feedback_anchor`
- [ ] Add DB-level rules that are safe with immediate checks:
- [ ] block comments cannot retain anchors
- [ ] anchors only attach to inline feedback
- [ ] Keep “inline must have both anchors” as API/repository transaction invariant.
- [ ] Phase output: schema migrated and queryable with realistic sample data.

References:
- `.planning/10_Round2_phased_design.md`
- `.planning/01_database_plan.md`

## Phase 4: Repository Mapping + Transactions
Goal: Implement repository methods with stable mapping between rows and DTO/domain types.

- [ ] Implement `FeedbackRepository.listByFileId(fileId)`:
  - [ ] query feedback rows
  - [ ] join/collect anchors
  - [ ] map to inline/block `FeedbackRecord` union
- [ ] Implement `FeedbackRepository.add(feedback)` transaction flow:
  - [ ] insert feedback row
- [ ] if inline, insert `start` and `end` anchors in same transaction
- [ ] rollback on failure
- [ ] (Optional Round 2 extension) add repository methods for edit/delete/apply/send-to-llm queueing.
- [ ] Phase output: repository provides real persisted reads/writes for block and inline comments.

References:
- `.planning/10_Round2_phased_design.md`
- `.planning/01_database_plan.md`
- `.planning/05_typescript_interfaces.md`

## Phase 5: IPC Handler Integration
Goal: Wire assessment IPC endpoints to repository and return shared DTO responses.

- [ ] Implement `assessment/listFeedback` handler:
  - [ ] validate request
  - [ ] call repository
  - [ ] map to `ListFeedbackResponse`
- [ ] Implement `assessment/addFeedback` handler:
- [ ] validate request
- [ ] call repository transaction
- [ ] return `AddFeedbackResponse`
- [ ] Maintain consistent `AppResult` envelope and error codes.
- [ ] Phase output: renderer can call real list/add feedback endpoints through preload.

References:
- `.planning/10_Round2_phased_design.md`
- `.planning/05_typescript_interfaces.md`

## Phase 6: Frontend Data Wiring (TanStack + State)
Goal: Wire comment data fetch/mutation flows into `AssessmentTab` and reducer.

- [ ] Add assessment API wrappers in renderer for list/add feedback.
- [ ] Add TanStack hooks:
  - [ ] `useFeedbackListQuery(fileId)`
- [ ] `useAddFeedbackMutation()`
- [ ] On query success, dispatch `feedback/setForFile`.
- [ ] On add success, update cache (or invalidate list query) and dispatch `feedback/add` if needed.
- [ ] Ensure selected file change triggers feedback refetch.
- [ ] Phase output: selected file loads real comments; new comment persists and appears in UI.

References:
- `.planning/10_Round2_phased_design.md`
- `.planning/04_state_management.md`

## Phase 7: AssessmentTab Composition + Prop-Driven Subfeatures
Goal: Replace placeholders with component composition using frozen interfaces.

- [ ] Refactor `AssessmentTab` to pass concrete props to:
  - [ ] `OriginalTextView`
  - [ ] `CommentsView`
  - [ ] expanded `ChatInterface`
- [ ] Guardrail check: no new inline subcomponent definitions inside `AssessmentTab.tsx`.
- [ ] Implement orchestrator state in `AssessmentTab`:
  - [ ] `pendingSelection`
  - [ ] `activeCommand`
  - [ ] `chatMode`
- [ ] `activeCommentId`
- [ ] `isProcessCenterOpen`
- [ ] Enforce chat mode rules:
  - [ ] default `comment`
  - [ ] command presence forces/locks `chat`
  - [ ] unlock when command clears
- [ ] Phase output: all three subfeatures interact through explicit props/events under `AssessmentTab`.

References:
- `.planning/10_Round2_phased_design.md`
- `.planning/04_state_management.md`
- `.planning/05_typescript_interfaces.md`

## Phase 8: OriginalTextView Feature Slice
Goal: Implement text selection and command-center behavior needed by workflow.

- [ ] Build `TextViewWindow` component:
  - [ ] render docx content
  - [ ] capture selection and emit normalized `PendingSelection`
- [ ] Build collapsible `ProcessCommandCenter` under viewer:
  - [ ] collapsed by default
  - [ ] emits command selections
- [ ] Guardrail check: `OriginalTextView.tsx` composes subcomponents; no deeply nested UI blocks inline.
- [ ] Hook selection output to `AssessmentTab` and then ChatInterface.
- [ ] Phase output: teacher highlight updates shared pending selection and command center drives chat command state.

References:
- `.planning/10_Round2_phased_design.md`
- `.planning/text-view/app/src/components/OriginalTextView.tsx`
- `.planning/text-view/app/src/hooks/useOriginalTextView.ts`
- `.planning/text-view/app/src/services/renderBridge.ts`
- `.planning/text-view/app/src/services/docxTextMap.ts`

## Phase 9: CommentsView Feature Slice
Goal: Implement comment list UI and tools behavior.

- [ ] Build `CommentsView` list rendering with `CommentView` items.
- [ ] Build `CommentHeader`, `CommentBody`, `CommentTools`.
- [ ] Render inline quote preview conditionally from comment kind.
- [ ] Guardrail check: comment row internals are split across `CommentView`, `CommentHeader`, `CommentBody`, `CommentTools` files.
- [ ] Implement tool actions wiring:
  - [ ] edit
  - [ ] delete
- [ ] send to LLM
- [ ] apply toggle
- [ ] Emit comment selection to support viewer focus.
- [ ] Phase output: full comment management UI with actionable tool events.

References:
- `.planning/10_Round2_phased_design.md`
- `.planning/04_state_management.md`

## Phase 10: ChatInterface Feature Slice
Goal: Implement workflow-aware chat/comment composer.

- [ ] Expand `ChatInterface` with:
  - [ ] `CommandDisplay`
  - [ ] `HighlightedTextDisplay`
  - [ ] `CommandDropdown`
  - [ ] controlled `ChatInput`
  - [ ] `ChatToggle`
- [ ] Guardrail check: `ChatInterface.tsx` remains orchestration/composition only.
- [ ] Implement submit branching:
  - [ ] comment mode sends `AddFeedbackRequest` (inline if selection exists, else block)
  - [ ] chat mode sends chat request
- [ ] Enforce lock rules when command is active.
- [ ] Phase output: teacher can create comments/chat from one interface with deterministic mode behavior.

References:
- `.planning/10_Round2_phased_design.md`
- `.planning/04_state_management.md`
- `.planning/05_typescript_interfaces.md`

## Phase 11: End-to-End Workflow Completion
Goal: Deliver the complete user workflow with cross-pane interactions.

- [ ] Highlight in `TextViewWindow` -> appears in `HighlightedTextDisplay`.
- [ ] Enter comment in `ChatInput` (comment mode) -> submit -> comment appears in `CommentsView`.
- [ ] Select comment row -> `OriginalTextView` attempts anchor focus.
- [ ] Apply/edit/delete/send-to-LLM actions update UI and persistence.
- [ ] Phase output: full Round 2 happy path implemented for teacher comment workflow.

References:
- `.planning/10_Round2_phased_design.md`
- `.planning/04_state_management.md`
- `.planning/05_typescript_interfaces.md`
- `.planning/01_database_plan.md`

## Phase 12: Test Track (Per Layer, As You Go)
Goal: Add tests in each phase to lock behavior and prevent regressions.

- [ ] Contract tests:
  - [ ] request/response shape fixtures for assessment contracts
- [ ] Validation tests:
  - [ ] IPC payload normalization and rejection cases
- [ ] Repository tests:
  - [ ] block insert/list
  - [ ] inline insert/list with two anchors
  - [ ] invariants around invalid anchor combos
- [ ] IPC integration tests:
  - [ ] `assessment/listFeedback`
  - [ ] `assessment/addFeedback`
- [ ] Renderer tests:
  - [ ] reducer updates (`feedback/setForFile`, `feedback/add`)
  - [ ] `AssessmentTab` orchestration behavior
  - [ ] `ChatInterface` toggle lock rules
  - [ ] `CommentsView` tool action events
- [ ] Organization guard checks:
  - [ ] enforce max-lines (or explicit manual gate) on `AssessmentTab.tsx` and `ChatInterface.tsx`
  - [ ] enforce no inline subcomponent declarations in parent composition files
- [ ] Workflow integration test:
  - [ ] highlight -> compose -> submit -> comment renders
- [ ] Phase output: test coverage mirrors architecture layers and supports safe iteration.

References:
- `.planning/10_Round2_phased_design.md`
- `.planning/12_testing_strategy.md`

## Exit Criteria (Round 2 Done)
- [ ] Shared assessment contracts are stable and used across renderer/preload/main.
- [ ] Feedback persistence works for both block and inline comments with anchors.
- [ ] Assessment IPC handlers are implemented with strict validation and typed responses.
- [ ] `AssessmentTab` subfeatures are prop-driven and integrated.
- [ ] Teacher workflow is operational end-to-end.
- [ ] Core repository/IPC/UI workflow tests pass.
