# Enhance Chat Plan

## Scope
This plan addresses five changes across Electron main services, shared IPC contracts, and `electron-llm`:
1. Split `electron-llm/main.py` into an entrypoint and a simple-chat pipeline module.
2. Keep the LLM server warm once chat begins.
3. Add a manual Python-side server switch-off entrypoint and shared contract file `electron/shared/llm-server.ts`.
4. Add placeholder Python entrypoints for `evaluate-simple`, `evaluate-with-rubric`, and `bulk-evaluate`.
5. Design chat-session memory so multi-turn context persists.

## Current Flow (Observed)
- Electron `chat/sendMessage` in `electron/main/ipc/chatHandlers.ts` calls `LlmOrchestrator`.
- `LlmOrchestrator` (`electron/main/services/llmOrchestrator.ts`) sends action requests over stdio to one long-lived Python worker (`PythonWorkerClient`).
- `PythonWorkerClient` (`electron/main/services/pythonWorkerClient.ts`) keeps a spawned Python process alive and reuses it across requests.
- `electron-llm/main.py` processes newline-delimited JSON requests in a loop and dispatches `llm.chat` / `llm.chatStream`.
- Runtime/model startup is managed through `RuntimeLifecycle.get_or_create_llm_runtime(...)` and `LlmServerProcess.ensure_running()`.

## Key Finding About “Warm Server”
- The Python worker is already long-lived.
- Warmth currently depends on runtime cache identity and lazy startup during each chat request.
- Practical gaps:
  - No explicit runtime start/stop API.
  - No explicit server status channel.
  - Warm behavior is implicit inside chat actions.

## Target Architecture
- `main.py` becomes a thin router/entrypoint only.
- Action pipelines move under `electron-llm/app/`:
  - `pipeline_simple.py` (current simple chat behavior)
  - future: `pipeline_evaluate_simple.py`, `pipeline_evaluate_with_rubric.py`, `pipeline_bulk_evaluate.py`
- Introduce explicit runtime lifecycle actions:
  - start/warm runtime
  - stop runtime
  - optional runtime status
- Introduce chat sessions with session-scoped memory held in Python process memory.

## Implementation Plan

### Phase 1: Refactor `main.py` into an action router
Files:
- `electron-llm/main.py`
- `electron-llm/app/pipeline_simple.py` (new)
- `electron-llm/app/pipeline_registry.py` (new, optional)

Steps:
1. Move simple-chat helpers and execution logic out of `main.py` into `app/pipeline_simple.py`.
2. Keep `main.py` responsible for:
   - request parsing/validation
   - response envelope helpers
   - action routing
   - top-level error handling
   - lifecycle shutdown in `finally`
3. Add route mapping in `main.py`:
   - `llm.chat` and `llm.chatStream` route to pipeline key `simple-chat`.

Acceptance:
- Existing chat + chatStream behavior is unchanged.
- `main.py` is small and pipeline-agnostic.

### Phase 2: Explicit warm runtime controls
Files:
- `electron-llm/main.py`
- `electron-llm/app/pipeline_simple.py`
- `electron/shared/llmContracts.ts`
- `electron/main/services/llmOrchestrator.ts`

Steps:
1. Add new Python actions in shared contracts (e.g. `llm.server.start`, `llm.server.stop`, optional `llm.server.status`).
2. Implement handlers in Python router:
   - `llm.server.start`: build/ensure runtime without sending chat.
   - `llm.server.stop`: call `RuntimeLifecycle.shutdown()` and clear active runtime.
3. Keep lazy `ensure_running()` in simple-chat as fallback, but allow proactive warm-up via start action.
4. Extend Electron orchestrator supported actions set to include new server actions.

Acceptance:
- App can explicitly warm model server before first prompt.
- App can explicitly stop server without killing Python worker process.

### Phase 3: Add dedicated shared contract `electron/shared/llm-server.ts`
Files:
- `electron/shared/llm-server.ts` (new)
- `electron/preload/apiTypes.ts`
- `electron/preload/index.ts`
- `electron/main/ipc/registerHandlers.ts`
- `electron/main/ipc/llmServerHandlers.ts` (new)

Steps:
1. Define canonical IPC request/response types for server lifecycle in `electron/shared/llm-server.ts`.
2. Add an `llmServer` preload module (do not touch renderer usage yet).
3. Add main IPC handlers that call orchestrator server actions.
4. Register new IPC channels in `registerHandlers.ts`.

Acceptance:
- Shared contract exists and is wired main+preload.
- Renderer remains untouched, but API surface is ready.

### Phase 4: Add placeholder entrypoints for future chat styles
Files:
- `electron-llm/main.py`
- optionally new placeholder files under `electron-llm/app/`

Steps:
1. Add router keys and action mappings for:
   - `evaluate-simple`
   - `evaluate-with-rubric`
   - `bulk-evaluate`
2. Return typed “not implemented yet” failures from these entrypoints.
3. Keep response envelope consistent with current `PY_ACTION_FAILED` behavior.

Acceptance:
- Entry points exist and are routable.
- No feature logic implemented yet.

### Phase 5: Chat session memory design + rollout
Files:
- `electron/shared/chatContracts.ts`
- `electron/shared/llmContracts.ts`
- `electron/main/ipc/chatHandlers.ts`
- `electron-llm/main.py`
- `electron-llm/app/pipeline_simple.py`
- optional `electron-llm/app/session_store.py` (new)

Steps:
1. Add `sessionId` to chat payload contract (`SendChatMessageRequest` and Python payload typing).
2. In Python, add in-memory session store keyed by `sessionId`.
3. For simple-chat pipeline:
   - append teacher message to session history
   - construct request context from history
   - append assistant response back into same session
4. Add lifecycle actions (optional but recommended):
   - `llm.session.create`
   - `llm.session.clear`
5. Define bounds to prevent memory growth:
   - max turns per session or token-window truncation.

Acceptance:
- Multi-turn chats retain context within a live app session.
- Session can be reset explicitly.

## Proposed Request/Action Naming
- Keep existing:
  - `llm.chat`
  - `llm.chatStream`
- Add:
  - `llm.server.start`
  - `llm.server.stop`
  - `llm.server.status` (optional)
  - `llm.session.create` (optional)
  - `llm.session.clear` (optional)

## Testing Plan

### Python tests
- Add/extend unit tests for:
  - router dispatch to `pipeline_simple`
  - server start/stop actions
  - placeholder action responses
  - session memory append/retrieve/clear

### Electron tests
- Update/add tests for:
  - orchestrator supported actions
  - new IPC handler wiring for `llmServer`
  - preload API typing/contract alignment

### Manual verification
1. Start chat once and confirm first-turn latency (cold start).
2. Send second/third message in same runtime and confirm reduced latency (warm).
3. Call server stop and verify next message incurs startup latency again.
4. Use same `sessionId` across turns and verify prior context influences responses.
5. Clear session and verify memory reset.

## Risks and Mitigations
- Risk: contract drift across shared/preload/main.
  - Mitigation: update shared contracts first, then preload/main in same change.
- Risk: memory growth with long sessions.
  - Mitigation: enforce history truncation policy.
- Risk: confusion between Python worker lifecycle and llama-server lifecycle.
  - Mitigation: expose explicit status fields (`workerAlive`, `serverReady`, `runtimeKey`).

## Sequencing Recommendation
1. Refactor `main.py` and extract `pipeline_simple.py`.
2. Add server lifecycle actions and shared `llm-server.ts` contract + IPC wiring.
3. Add placeholder evaluation entrypoints.
4. Implement session memory.
5. Add/refresh tests after each phase.

