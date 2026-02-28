# EssayLens
Read what this app is about before implementing anything.
- Reference agent_what_is_essay_lens.md

## Frontend architecture
UI Layer: focuses on hooks (react, TanStack), event handlers, local UI state, Toast, dispatch (folders within each component: state, hooks, reducers)
Application layer: Contains workflow logic, dispatch logic, state transitions, calls API, no React, uses domain layer (folders within each component: application, services)
Domain layer: pure functions, business rules, types, mappers, no react, no electron, no side effects (folders within each component: domain)
Infrastructure layer: electron bridge, window.api, how to talk to electron, how to call apis, how to fetch data (folders at the renderer/src level: adapters, ports)

## What is EssayLens tech stack?
- This app is an electron app.
- Electron will handle the database.
- Tanstack will manage state in the front end.
- React with vite will provide the UI and component states - reducers are responsible only for UI state
- Python is spawned by electron to handle all LLM interactions. Python does not need to touch the database
- TypeScript is used everywhere in electron and renderer



----------------------Technical Specifications----------------------
## 1) High-level architecture

- Runtime model: Electron desktop app with isolated renderer.
- Main process: `electron/main` registers all IPC handlers and owns service/repository orchestration.
- Preload bridge: `electron/preload/index.ts` exposes `window.api` with typed modules (`workspace`, `assessment`, `rubric`, `chat`).
- Shared contracts: `electron/shared/*Contracts.ts` and `electron/shared/appResult.ts` define request/response payloads and result envelopes used on both sides.
- Renderer app: React + local reducer state + React Query for async fetching/mutations.

## 2) IPC contract boundary rule

- `electron/shared/*Contracts.ts` and `electron/shared/appResult.ts` are the canonical renderer-main IPC contracts.
- Do not redefine IPC request/response payload types separately in renderer or main.
- If a contract changes, update shared contracts first, then keep preload types (`electron/preload/*`), main handlers (`electron/main/ipc/*`), and renderer ports/adapters/services in sync.

## 3) Change safety checklist for agents

- Keep IPC contracts aligned with shared types in `electron/shared/*Contracts.ts`.
- Preserve `AppResult` envelope for every preload/main call.
- Do not bypass preload; renderer should call `window.api` only.
- When editing selection/anchor logic, keep `RenderBridge` and feedback anchor schema consistent.
- Preserve split-ratio clamping and keyboard resizing behavior.
- Preserve tab ARIA semantics and chat-collapse layout behavior.
- If adding persistence, implement repositories behind current interfaces so handlers and renderer contracts remain stable.
- When generating uuid numbers for database entry, do so in the electron repositories files.


## 4) What to read next
- If editing front end through renderer folder, read agent_frontend.md
- If editing back end through electron folder or electron-llm folder, read agent_electron.md
- If doing any work with the database, read agent_database.md
- For any cross-layer feature or debug tasks that span renderer + IPC + main, read agent_workflows.md, agent_electron.md and agent_frontend.md

## 5) Doc ownership & Doc Updates
- agent_frontend.md = renderer / UI / state / layout
- agent_electron.md = preload / ipc / main / services / electron-llm
- agent_database.md = schema/migrations/repo persistence
- agent_workflows.md = cross-layer user flow

If code changes affect one of the above domains, update its doc in the same task.
