# Renderer State Ownership

This document defines where state belongs in `renderer/`.

## Rules

- React Query owns all server state.
- Reducers/context own UI and workflow state only.
- Do not duplicate the same server entity in both Query cache and reducers.

## Ownership Map

### React Query (server state)

- Workspace data from backend (`selectFolder`, `listFiles` results).
- Feedback lists and feedback mutations.
- Rubric lists, rubric matrix data, grading context, file scores.
- LLM manager catalog, downloaded models, active model, settings.

### Global app reducer (`renderer/src/state`)

- Cross-feature UI state only:
  - `ui.activeTopTab`
  - `ui.activeCommentsTab`
  - `ui.isChatCollapsed`
  - `ui.assessmentSplitRatio`
- Shared client-side workspace/rubric/chat UI choices still needed across features.

### Feature-local reducers/hooks

- Assessment tab local interaction state:
  - pending selection
  - active command
  - chat mode
  - active comment id
  - draft text
- Rubric tab local selection/mode UI state.
- Text view zoom/layout state.
- Per-component ephemeral state (dropdown open, input drafts, inline edit mode).

## Anti-patterns

- Copying query results into reducer caches.
- Separate loading/error flags for data already tracked by Query.
- Global state for one-component ephemeral UI state.

## Change Checklist

When adding state:

1. Is it fetched/mutated from backend? Use React Query.
2. Is it cross-feature UI state? Use global reducer.
3. Is it feature-local interaction state? Keep it local to that feature.
4. Is it purely ephemeral component UI state? Use component local state.
