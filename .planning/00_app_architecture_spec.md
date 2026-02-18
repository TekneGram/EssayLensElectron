# App Architecture Spec

## Purpose
Define the high-level technical architecture for EssayLens so UI features and backend integrations are implemented with consistent boundaries.

## Tech Stack
- Desktop shell: Electron
- Frontend: React + Vite + TypeScript
- Server-state/query layer: TanStack Query
- Global UI/session state: React Context + reducers
- Local database: SQLite3
- AI/LLM integration: Python process spawned by Electron main process
- User notifications: React-Toastify

## Testing Stack
- Unit + integration runner: Vitest.
- Component testing: `@testing-library/react` + `@testing-library/user-event`.
- Electron end-to-end testing: Playwright (`_electron`).

Round 1 boundary:
- Use the above stack only.
- Defer additional tooling (for example dedicated accessibility tooling and expanded DB harnesses) to later rounds.

## Architecture Layers
1. Renderer (React UI)
- Pure UI components, feature containers, hooks.
- Uses `window.api.*` typed IPC bridge for side effects.
- No direct DB access and no direct Python process management.

2. Renderer State Layer
- React Context + reducers for app-global UI/session state.
- TanStack Query for async alignment with backend/DB-backed data.

3. IPC Bridge Layer
- Typed preload API surface (`window.api.*`).
- Validates and forwards requests between renderer and main.

4. Electron Main Layer
- Owns SQLite access.
- Owns Python process spawn, lifecycle, and orchestration.
- Returns normalized responses/errors to renderer via IPC.

5. Python Worker Layer
- Handles LLM-related processing.
- Never called directly by renderer.

## State Ownership Rules

### Global state in Context + reducers
Use Context/reducers for app-level UI/session state:
- current working directory (CWD)
- selected/active file
- comments state
- chat state
- rubric state

Note:
- audit state is out of scope in renderer and handled in backend.

### TanStack Query responsibility
Use TanStack Query for:
- async reads/writes that align renderer with SQLite-backed backend state
- request lifecycle (`loading`, `error`, retry policies, cache invalidation)

Boundary rule:
- Context holds interaction/session state.
- TanStack Query holds async backend-synchronized state.

## Data Flow Principles
1. UI emits intent from presentational components.
2. Feature container/hook handles orchestration.
3. Container calls typed IPC (`window.api.*`).
4. Main process performs DB/Python operations.
5. Renderer updates Context and/or Query cache from returned result.

## Error Handling
- User-facing errors are surfaced via React-Toastify.
- Domain/service errors are normalized in main before returning to renderer.
- Renderer avoids raw exception dumps in UI; show concise actionable messages.

## Feature Structure Conventions
For each feature:
- `components/`: presentational UI only
- `*Container.tsx`: data/control orchestration
- `hooks/`: reusable feature logic
- `services/`: adapter calls (IPC-facing in renderer, infra-facing in main)
- `types.ts`: feature-level TypeScript contracts
- `__tests__/` and `*.test.ts(x)`: co-located unit/integration tests for that feature's containers/hooks/components

Project-level test placement:
- `tests/integration/`: cross-layer integration tests (renderer <-> preload <-> main <-> DB/Python)
- `tests/e2e/`: Electron end-to-end workflows

## Non-Goals For This Stage
- Detailed query-key design and cache policy fine-tuning
- Detailed Python protocol schema
- Detailed DB migration strategy

These are deferred until feature-level integration specs.
