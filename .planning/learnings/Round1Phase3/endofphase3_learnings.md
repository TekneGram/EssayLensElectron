- **What was built in Phases 1, 2, and 3, and why it was built this way**
- Phase 1 established the project runtime/tooling foundation so later UI and backend work could run in a repeatable way: root scripts, Electron/renderer TypeScript projects, build-only tsconfigs, and packaging include/exclude rules.
- Phase 1 used a lean stack by design (`vitest`, Testing Library, Playwright) to match Round 1 scope and avoid overbuilding test infrastructure before core flows exist.
- Phase 1 packaging rules were intentionally strict so non-runtime content (tests/spec docs/`.planning`) is excluded early, reducing risk of shipping development files.
- Phase 2 built the Electron runtime skeleton as a boundary-first architecture: main process bootstrap, typed preload API (`window.api`), IPC handler registration, DB/service/repository stubs, and unit smoke tests.
- Phase 2 was implemented with placeholders instead of full business logic so interfaces and process ownership were stabilized first (renderer -> preload -> main), consistent with architecture specs.
- Phase 2 ensured renderer does not directly access DB/Python and prepared typed IPC contracts for later real workflows.
- Phase 3 built the first runnable renderer frame and layout shells that map directly to the planned UX structure: `LoaderBar`, `FileDisplayBar`, `AssessmentWindow`, `ChatView`, `ChatInterface`, plus `AssessmentTab` and `RubricTab` switching.
- Phase 3 implementation focused on structure and tab behavior (default tab, visibility, `aria-selected`) rather than full feature logic, matching the phase checklist and lightweight scope.
- Phase 3 added style-layer scaffolding (`tokens`, `themes`, `base`, `layout`, `components`) so the visual system can scale without one-off styles.
- Target references for Round 1 design intent were `AssessmentTab.png` and `RubricTab.png`.
- Achieved references at end of Phase 3 are `EndOfPhase3-assessmentview.png` and `EndOfPhase3-rubricview.png`.
- The achieved screenshots show the shell and tab-state architecture is in place and aligned with the planned layout direction, while still intentionally lightweight in interaction depth.

- **Notes on how you interacted with me during Phases 1, 2, and 3 (with specifics)**
- You directed the work with strict phase boundaries, and repeatedly required us to stop after each phase rather than rolling forward automatically.
- You asked for practical delivery artifacts each phase: implementation, checks, and copy/paste git + PR commands.
- After Phase 3, you explicitly switched to review-only mode with: "Do not code anything else. Let's review the code as it currently is."
- In that review step, you asked a focused runtime question: whether anything could prevent `npm run dev` from working.
- I reported concrete startup risks (`require.main` bootstrap gate, Electron build output dependency, and potential wait-on/port mismatch).
- You challenged one recommendation directly and asked for rationale: why `wait-on tcp:5173` exists at all, noting you had not seen it before and that Vite was on `5173`.
- You also clarified a key process detail: you ran `npm run dev` (not `dev:electron` directly), prompting discussion that `dev` still executes `dev:electron` through `concurrently`.
- You then set explicit acceptance criteria for the fix: keep `wait-on`, replace `require.main`, and make Electron build automatic in dev.
- That interaction sequence produced a concrete dev workflow change in `package.json`: add `dev:electron:watch` and make `dev` run renderer + Electron watch + Electron launch together.
- You validated behavior yourself after the fix and confirmed outcome: Electron window now loads.

## What you learn from phases 1, 2 and 3

### 1) Staged architecture delivery (tooling -> runtime boundaries -> UI frame)
- The project was intentionally built in layers so each phase leaves a runnable baseline for the next phase.
- Phase 1 gave script/tooling/build structure; Phase 2 gave process boundaries and IPC skeleton; Phase 3 gave visual shell and navigation behavior.
- This reduced integration ambiguity because each phase had a narrow acceptance target.

File: `package.json`
```json
{
  "scripts": {
    "build": "npm run build:renderer && npm run build:electron",
    "typecheck": "tsc -p renderer/tsconfig.json --noEmit && tsc -p electron/tsconfig.json --noEmit"
  }
}
```

### 2) Why Electron startup depends on wiring details, not just Vite status
- A running Vite server does not guarantee a desktop window; the Electron main process still has to execute bootstrap code that creates `BrowserWindow`.
- The no-window issue came from startup gating logic, not from renderer code.

File: `electron/main/index.ts`
```ts
if (!process.env.VITEST) {
  void createMainApp().start();
}
```

### 3) Why `npm run dev` can fail if Electron outputs are missing
- Electron in this project runs compiled main/preload from `dist-electron/**`.
- If those files are not built, `electron .` can launch without executable app entry points.
- The fix was to make compile/watch part of `dev`, not a manual pre-step.

File: `package.json`
```json
{
  "scripts": {
    "dev": "concurrently -k \"npm:dev:renderer\" \"npm:dev:electron:watch\" \"npm:dev:electron\"",
    "dev:electron:watch": "tsc -p electron/tsconfig.build.json --watch --preserveWatchOutput"
  }
}
```

### 4) What `wait-on` is doing in this app
- `wait-on` is a startup synchronizer: it delays Electron launch until required dependencies are ready.
- In this setup, it waits for both Vite port readiness and compiled Electron files before launching the app process.
- This prevents startup race conditions where Electron starts before its dependencies are available.

File: `package.json`
```json
{
  "scripts": {
    "dev:electron": "wait-on tcp:5173 dist-electron/main/index.js dist-electron/preload/index.js && cross-env VITE_DEV_SERVER_URL=http://localhost:5173 electron ."
  }
}
```

### 5) Why renderer and Electron use separate build pipelines
- Renderer uses Vite (`renderer/vite.config.ts`), but Electron main/preload use TypeScript compile outputs (`dist-electron/**`).
- These are distinct runtime targets, so one watcher is not enough for both.

File connection map:
- `renderer/src/main.tsx` -> bundled by Vite -> `renderer/dist/**`
- `electron/main/index.ts` + `electron/preload/index.ts` -> compiled by `tsc` -> `dist-electron/**`
- `electron .` starts from `package.json` `main` (`dist-electron/main/index.js`)

### 6) Why tests were useful even in a scaffold phase
- Tests caught real integration issues early (for example preload typing assumptions and environment setup differences between Node and jsdom).
- This kept the scaffold honest: structure-only code still had to satisfy runtime/test contracts.

File: `vitest.config.ts`
```ts
export default defineConfig({
  test: {
    environment: 'node',
    environmentMatchGlobs: [['renderer/src/**/*.test.tsx', 'jsdom']],
    setupFiles: ['./renderer/src/test/setup.ts']
  }
});
```

### 7) Why strict phase boundaries still delivered visible progress
- Even without full DB/business logic, the app now has a working shell, tab behavior, and dev startup flow.
- This matches Round 1 target intent from `AssessmentTab.png` and `RubricTab.png`, and is evidenced by `EndOfPhase3-assessmentview.png` and `EndOfPhase3-rubricview.png`.
- The key lesson is that constrained scope can still produce high-confidence, demonstrable outcomes when each phase has concrete verification criteria.
