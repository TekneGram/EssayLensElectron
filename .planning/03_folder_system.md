# Folder System Spec

## Purpose
Define a production-ready project layout for Electron + React/Vite + TypeScript + SQLite + spawned Python, with clear boundaries for development and packaging.

## Root Layout

```txt
project-root/
├── .planning/
│   ├── 00_app_architecture_spec.md
│   ├── 01_database_plan.md
│   ├── 02_broad_component_hierarchy.md
│   ├── 03_folder_system.md
│   ├── 04_state_management.md
│   ├── 05_typescript_interfaces.md
│   ├── 06_python_backend_integration_spec.md
│   ├── 07_layout_spec.md
│   ├── 09_styles_spec.md
│   └── features/
│       ├── 01_file-control.md
│       ├── 02_assessment_window_tabs_spec.md
│       ├── 03_assessment-tab.md
│       ├── 04_rubric-tab.md
│       └── 05_assessment-pane-resize.md
├── electron/
│   ├── main/
│   │   ├── index.ts
│   │   ├── ipc/
│   │   │   ├── workspaceHandlers.ts
│   │   │   ├── assessmentHandlers.ts
│   │   │   ├── rubricHandlers.ts
│   │   │   └── chatHandlers.ts
│   │   ├── db/
│   │   │   ├── sqlite.ts
│   │   │   └── repositories/
│   │   │       ├── workspaceRepository.ts
│   │   │       ├── feedbackRepository.ts
│   │   │       ├── rubricRepository.ts
│   │   │       └── chatRepository.ts
│   │   └── services/
│   │       ├── fileScanner.ts
│   │       ├── documentExtractor.ts
│   │       ├── llmOrchestrator.ts
│   │       └── feedbackFileGenerator.ts
│   └── preload/
│       ├── index.ts
│       └── apiTypes.ts
├── renderer/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── app/
│       ├── features/
│       ├── state/
│       ├── services/
│       ├── types/
│       └── styles/
├── python/
│   ├── worker.py
│   ├── llm/
│   └── requirements.txt
├── package.json
└── tsconfig.base.json
```

## Layer Ownership
- `renderer/`: UI, containers/hooks, context/reducers, query layer, typed IPC client calls.
- `electron/main/`: DB access, filesystem ops, Python process spawn/orchestration, IPC handlers.
- `electron/preload/`: typed secure bridge (`window.api.*`).
- `python/`: LLM and backend processing workers called only by main process.
- `.planning/`: specs only, never imported by runtime code.

## Renderer Feature Layout

```txt
renderer/src/features/<feature>/
  <Feature>Container.tsx
  components/
  hooks/
  services/
  types.ts
```

Rules:
- Presentational components in `components/`.
- Domain/app writes orchestrated in container/hook/service layers.
- No direct DB access in renderer.

## Electron Main Layout

```txt
electron/main/
  index.ts
  ipc/
    workspaceHandlers.ts
    assessmentHandlers.ts
    rubricHandlers.ts
    chatHandlers.ts
  db/
    sqlite.ts
    repositories/
      workspaceRepository.ts
      feedbackRepository.ts
      rubricRepository.ts
      chatRepository.ts
  services/
    fileScanner.ts
    documentExtractor.ts
    llmOrchestrator.ts
    feedbackFileGenerator.ts
```

Rules:
- Main process is the only owner of DB and Python lifecycle.
- IPC handlers validate input and return normalized results/errors.

### Electron Workflow Mapping
- `workspaceHandlers.ts` + `workspaceRepository.ts` + `fileScanner.ts`:
  - folder selection, cwd persistence, file discovery/indexing.
- `assessmentHandlers.ts` + `documentExtractor.ts` + `feedbackRepository.ts`:
  - document extraction, feedback persistence/retrieval.
- `rubricHandlers.ts` + `rubricRepository.ts`:
  - rubric list/detail/score retrieval and updates.
- `chatHandlers.ts` + `chatRepository.ts` + `llmOrchestrator.ts`:
  - chat persistence and LLM-backed responses.
- `feedbackFileGenerator.ts`:
  - final feedback-file generation pipeline.

## Dev Script Expectations

`package.json` should provide at least:

```json
{
  "scripts": {
    "dev": "concurrently \"npm:dev:renderer\" \"npm:dev:electron\"",
    "dev:renderer": "vite --config renderer/vite.config.ts",
    "dev:electron": "wait-on tcp:5173 && cross-env VITE_DEV_SERVER_URL=http://localhost:5173 electron .",
    "typecheck": "tsc -p renderer/tsconfig.json --noEmit && tsc -p electron/tsconfig.json --noEmit",
    "build": "npm run build:renderer && npm run build:electron",
    "build:renderer": "vite build --config renderer/vite.config.ts",
    "build:electron": "tsc -p electron/tsconfig.json",
    "package": "npm run build && electron-builder",
    "package:dir": "npm run build && electron-builder --dir"
  }
}
```

Notes:
- `concurrently`, `wait-on`, and `cross-env` are expected dev dependencies.
- `dev:electron` should launch Electron only after renderer dev server is ready.
- Electron main loads `VITE_DEV_SERVER_URL` in dev and local built files in production.

## Build/Package Expectations
- Dev mode:
  - Renderer served by Vite dev server.
  - Electron main/preload run from TypeScript output or runtime transpile path.
- Production build:
  - Renderer output in `renderer/dist/`.
  - Electron output in `dist-electron/` (or configured equivalent).
- Packaging:
  - Bundle Electron app with renderer build assets.
  - Include Python runtime/entrypoints as extra resources.
  - Ensure SQLite DB path resolves to app data directory at runtime.

## Runtime Path Expectations
- Dev:
  - Python entrypoint resolved from repo path (`python/worker.py`).
- Packaged:
  - Python resources resolved via packaged resource path.
- DB:
  - never write DB into source tree in production.

## Optional Monorepo Variant
If desired, `electron/`, `renderer/`, and `python/` can be separate workspace packages.
Current baseline assumes a single package root for simplicity.

## Acceptance Criteria
- `npm run dev` starts renderer and Electron together.
- Renderer hot reload works while Electron is open.
- `npm run build` produces renderer and electron artifacts with no import path conflicts.
- `npm run package` creates installable artifacts and includes required Python resources.
