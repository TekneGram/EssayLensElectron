# State Management Spec (Round 1)

## Purpose
Define renderer-side state ownership and reducer architecture for the first implementation round.

## Stack Decision
- Global UI/session state: React Context + reducers.
- Async backend-aligned state: TanStack Query.
- Local interaction state: component/hook state.

## Ownership Boundaries

### Context + reducers (global app/session state)
Own in reducers:
- current working directory and discovered files
- selected file
- chat transcript + draft state
- feedback collections by file
- rubric list + selected rubric + active matrix
- UI state (active top tab, active comments tab, theme)

### TanStack Query (async state)
Own in queries/mutations:
- loading/error/success lifecycle for IPC-backed operations
- cache for data returned from Electron main
- invalidation/refetch behavior after writes

### Local component/hook state
Own locally:
- ephemeral UI state (hover/open/drag/focus)
- pane resizing transient values
- uncontrolled input drafts (if not globally needed)

## Reducer Slices

```ts
AppState {
  workspace: WorkspaceState;
  chat: ChatState;
  feedback: FeedbackState;
  rubric: RubricState;
  ui: UiState;
}
```

Slice responsibilities:
- `workspaceReducer`: cwd, files, selected file, extracted text model cache.
- `chatReducer`: messages, draft, send status, chat error.
- `feedbackReducer`: comments by file, load/save status.
- `rubricReducer`: rubric catalog, selected rubric, active matrix.
- `uiReducer`: top-level tab, comments sub-tab, theme.

## Action Naming Convention
Use domain-prefixed string literals:
- `workspace/setFolder`
- `workspace/setFiles`
- `chat/addMessage`
- `feedback/setForFile`
- `rubric/setMatrix`
- `ui/setTopTab`

Rule:
- Reducers remain pure.
- Side effects happen in controllers/hooks/services.

## Provider Composition (Renderer)

Recommended order:
1. `QueryClientProvider`
2. `AppStateProvider`
3. `ToastContainer` host
4. App routes/shell

Rationale:
- Query layer is available to state orchestration hooks.
- App context remains focused on global interaction/session state.

## Query + Reducer Interaction Pattern
1. Container/hook executes query/mutation.
2. On success, map backend payload to frontend read model.
3. Dispatch reducer actions for canonical global state.
4. On error, dispatch error state + show Toastify notification.

## Error State Policy
- Keep user-facing errors concise in state (`error?: string`).
- Preserve structured backend error in query layer when needed.
- Do not store raw exception objects in reducer state.

## Persistence Policy (Round 1)
- Persisted in backend: workspace, files, chat, feedback, rubric data.
- Persisted in frontend storage: optional UI preferences only (theme, pane layout).

## Non-Goals (Round 1)
- Time-travel/debug tooling integration.
- Complex normalized entity cache in reducers.
- Cross-process optimistic updates.

## Acceptance Criteria
- App has one `AppStateProvider` with composed slice reducers.
- Query operations do not bypass reducer updates for canonical UI state.
- Reducers remain side-effect free.
- Error flows consistently surface via Toastify and slice error fields.
