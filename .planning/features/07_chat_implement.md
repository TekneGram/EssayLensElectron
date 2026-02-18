# Feature Implementation Plan: ChatInterface (07)

## Objective
Implement `ChatInterface` as a structured command + message composer that supports:
1. teacher comments (no command selected), and
2. LLM-directed requests (command selected),
while preserving current app layout semantics and extending state/query contracts in a predictable, testable way.

## Inputs reviewed
- Runtime implementation across renderer and electron main (excluding `.planning`).
- Feature brief: `features/06_chat_int`.
- Phase structure reference: `10_round1_implementation_checklist.md`.
- Style/layout/state/testing references: `09_styles_spec.md`, `07_layout_spec.md`, `04_state_management.md`, `12_testing_strategy.md`.

## Deliverables
- `ChatInterface` split into focused subcomponents:
  - `HighlightDisplay`
  - `CommandDisplay`
  - `CommandDropdown`
  - `ChatInput`
  - send action control
- New typed command and composition interfaces shared by renderer + preload + main.
- TanStack mutations for:
  - local teacher feedback creation path
  - LLM chat/command path
- Deterministic reducer updates for chat + feedback + audit-style system messages.
- Coverage for component behavior, reducer behavior, and mutation success/failure flows.

---

## Phase 0 — Discovery + design lock

### Scope
Freeze implementation constraints before coding.

### Tasks
- Confirm current `ChatInterface` and `ChatView` semantics, and collapse/expand interaction behavior remain intact.
- Confirm style baseline for “invisible controls + light outer border only” with existing tokens.
- Catalog existing IPC routes and identify extension points:
  - `assessment/addFeedback`
  - `chat/sendMessage`
- Define command taxonomy for Round 1:
  - `none` (comment)
  - `bulk`
  - `topic-sentence`
  - `comment`

### Exit criteria
- Agreed command set and payload shape documented (in code comments/types) prior to UI and handler changes.

---

## Phase 1 — Type contracts + state shape (no behavior changes)

### Scope
Add compile-time contracts first to reduce regressions during UI/hook implementation.

### Renderer types
- Extend `renderer/src/types/commands.ts`:
  - `ChatCommandType`
  - `ChatIntent` (comment vs llm)
  - `ComposeChatMessageCommand` (command, message, optional highlight, optional fileId)
- Extend `renderer/src/types/models.ts` (or nearby types file) with optional metadata for chat display:
  - `command?: ChatCommandType`
  - `highlightExcerpt?: string`

### State slice changes
- Extend `ChatState` with composition context fields:
  - `selectedCommand: ChatCommandType | null`
  - `selectedHighlightText: string | null`
- Add reducer actions:
  - `chat/setSelectedCommand`
  - `chat/setSelectedHighlightText`
  - `chat/resetComposer`

### Shared/electron contract changes
- Extend `electron/shared/chatContracts.ts` payload for command-aware LLM requests:
  - `command?: string`
  - `highlightText?: string`
- Keep backward compatibility with existing `message` payload.

### Exit criteria
- Typecheck passes with no runtime behavior changes.

---

## Phase 2 — ChatInterface UI decomposition + styling

### Scope
Replace monolithic `ChatInterface` markup with subcomponents matching feature brief layout.

### Component plan
Create new folder:
`renderer/src/features/layout/components/chat-interface/`

Components:
- `CommandDisplay.tsx`
- `HighlightDisplay.tsx`
- `CommandDropdown.tsx`
- `ChatInput.tsx`
- Optional `SendButton.tsx`

Container:
- Keep `ChatInterface.tsx` as orchestrator that composes the subcomponents.

### UX behavior
- Top row: `CommandDisplay` (left) + `HighlightDisplay` (right).
- Bottom row: `CommandDropdown` + `ChatInput` + send button.
- Single command at a time.
- Highlight text truncated with ellipsis and `title` tooltip containing full excerpt.
- Enter submits; Shift+Enter inserts newline (if textarea retained).
- Existing “chat intent expands collapsed panel” behavior preserved.

### Styling plan
- Add chat-interface-specific classes in `renderer/src/styles/components.css`.
- Apply “minimal visual chrome” rule:
  - only outer `ChatInterface` border/top seam
  - no internal control borders/backgrounds
  - token-based colors only

### Exit criteria
- Chat interface visually matches mockup intent and remains keyboard accessible.

---

## Phase 3 — Query/mutation wiring and intent routing

### Scope
Implement send flow routing between feedback and LLM paths.

### New hook
Create:
`renderer/src/features/layout/hooks/useChatInterface.ts`

Responsibilities:
- Own local composer draft value.
- Read selected file id + chat composition context.
- Build intent:
  - no command => comment/feedback mutation
  - command selected => chat/LLM mutation
- Dispatch reducer updates for optimistic status and resolved results.
- Normalize errors to toast + reducer error field.

### Mutation paths
1. **Comment path (no command selected)**
   - Call `window.api.assessment.addFeedback` with `kind: block` default (Round 1).
   - On success:
     - append teacher-origin feedback in `feedback.byFileId`
     - append confirmation/system message in `chat.messages`
     - reset draft/highlight/command per `chat/resetComposer` policy.

2. **LLM path (command selected)**
   - Call `window.api.chat.sendMessage` with `message`, `command`, `highlightText`, `fileId`, optional `contextText`.
   - On success:
     - append teacher message + assistant reply in `chat.messages`
     - optional system audit message for command execution
     - preserve or clear selected command per UX decision (default clear).

### Exit criteria
- Send button and keyboard submit correctly route both paths and update state.

---

## Phase 4 — Electron IPC + repository extensions

### Scope
Support new payload metadata and non-placeholder feedback persistence pathway.

### Main process tasks
- `electron/main/ipc/chatHandlers.ts`
  - accept/normalize `command` and `highlightText` in payload.
  - include command metadata in persisted teacher + assistant records if schema allows.
- `electron/main/ipc/assessmentHandlers.ts`
  - implement functional `addFeedback` handler (replace placeholder).
  - return normalized `AppResult` with created feedback item.

### Repository tasks
- `feedbackRepository.ts`
  - replace placeholder implementation with in-memory persistence parity to current chat repo style (Round 1 baseline).
- Optional: audit repository stub
  - add minimal structure or system-message approach to track command/comment actions.

### Preload API updates
- `electron/preload/apiTypes.ts`
  - tighten assessment/chat payload and response types from `unknown` to explicit contracts.
- `electron/preload/index.ts`
  - forward enriched payloads unchanged.

### Exit criteria
- Renderer can submit both intents against typed IPC endpoints without `unknown` casts.

---

## Phase 5 — ChatView/CommentsView integration and synchronization rules

### Scope
Ensure output appears in intended surfaces.

### Rules
- Teacher comment with no command:
  - appears in `CommentsView` (feedback list)
  - optional concise system line in `ChatView`
- Commanded LLM request:
  - appears in `ChatView` as teacher + assistant thread
  - if response represents feedback, also add/bridge into `CommentsView` item model (source=`llm`).

### Implementation notes
- Introduce selectors to avoid repeated state derivation in components.
- Guard against missing `selectedFileId`:
  - disable send or show inline message/toast.

### Exit criteria
- No-command and command flows produce correct cross-pane visibility.

---

## Phase 6 — Tests and validation

### Renderer tests
- New component tests:
  - render/layout presence for all subcomponents
  - single-command selection behavior
  - highlight truncation rendering
  - submit routing behavior (comment vs command)
- Hook/integration tests:
  - successful comment mutation updates feedback + chat message
  - successful LLM mutation updates teacher + assistant chat
  - error path sets status/error and shows toast

### Electron tests
- `chatHandlers` tests for payload normalization with command/highlight.
- `assessmentHandlers` tests for `addFeedback` success/error envelope behavior.

### Non-test checks
- `npm run typecheck`
- `npm run test`
- Manual phase-gate commands (user-run):
  - `npm run dev`
  - `npm run build`
  - `npm run start:prod`
  - `npm run package` (or `npm run package:dir`)

### Exit criteria
- Tests green and no regressions in existing chat collapse/layout behavior.

---

## Implementation sequencing (recommended)
1. Phase 1 contracts/state
2. Phase 2 UI decomposition/style
3. Phase 3 renderer hook + routing
4. Phase 4 main/preload/repository support
5. Phase 5 cross-surface synchronization
6. Phase 6 test hardening + validation

---

## Risks and mitigations
- **Risk:** Ambiguity between “comment command” and “no command comment path”.
  - **Mitigation:** Normalize to explicit `intent` derived from `selectedCommand` (`null => feedback`), and treat `comment` command as LLM intent only if explicitly selected.
- **Risk:** State duplication between local draft and global `chat.draft`.
  - **Mitigation:** Pick one ownership model (recommended: local draft in hook for composer, global for persisted transcript only).
- **Risk:** Placeholder backend handlers cause UI dead ends.
  - **Mitigation:** implement minimal in-memory repository parity in this phase.

---

## Mockup output required by spec
Created mockup assets in:
- `.planning/chat-interface/chat-interface-mockup.html`
- `.planning/chat-interface/chat-interface-mockup.css`

Mockup includes:
- command dropdown with `bulk`, `topic sentence`, `comment`
- truncated highlighted-text display
- two-row ChatInterface layout with minimal visual chrome
