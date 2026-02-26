# Enhance Chat Plan

## Context recap (current architecture)

### Electron ↔ Python communication path
1. `electron/main/ipc/chatHandlers.ts` receives `chat/sendMessage`, validates payload/settings, and calls `LlmOrchestrator` using `llm.chatStream` (or `llm.chat` fallback).
2. `electron/main/services/llmOrchestrator.ts` wraps each request with `requestId/timestamp`, enforces a supported action list, and delegates to `PythonWorkerClient`.
3. `electron/main/services/pythonWorkerClient.ts` maintains a long-lived Python subprocess (`python3 -u electron-llm/main.py` in dev), writes JSON-lines requests to stdin, and reads JSON-lines responses/events from stdout.
4. `electron-llm/main.py` parses each request and dispatches action handlers (`llm.chat`, `llm.chatStream`, placeholders for assess/summary).
5. Runtime model/server setup currently happens via `_build_runtime(...)` inside `main.py`, which pulls config, asks `RuntimeLifecycle` for cached runtime, and calls `server_proc.ensure_running()` before sending prompt tasks.

### Current Python behavior relevant to the request
- `main.py` currently mixes protocol parsing, request dispatch, runtime build, simple chat execution, stream handling, and helper extraction functions in one file.
- `RuntimeLifecycle` already supports process-level caching by `runtime_identity`, so warm-runtime behavior is partially present. However, there is no explicit protocol-level action for “manual server shutdown,” and no chat-session memory abstraction for multi-turn history.

---

## Requested changes mapped to a delivery plan

## Phase 1 — Refactor `main.py` into entry-point router + pipeline module
**Goal:** turn `main.py` into a dispatcher and move simple-chat logic to a dedicated pipeline file.

1. Create a new pipeline module under `electron-llm/app/` (requested name: `pipeline-simple.py`).
   - Because hyphens are not import-friendly in Python modules, use one of:
     - `pipeline_simple.py` as the true module + optional compatibility wrapper/file docs, or
     - dynamic import loader if strict filename `pipeline-simple.py` is mandatory.
   - Move existing simple chat helpers and handlers from `main.py` into this module:
     - message extraction
     - fake reply extraction
     - runtime build helper usage
     - simple chat sync + stream flow
2. Keep `main.py` focused on:
   - stdin loop + JSONL protocol envelope
   - action routing
   - error mapping + response writing
3. Add an internal action-to-handler router in `main.py` so new modes are entry-point-first and easy to extend.

Deliverables:
- Smaller `main.py` with routing only.
- New simple-chat pipeline module with migrated logic.
- No renderer changes.

---

## Phase 2 — Add strategy-style entry points in Python
**Goal:** support mode selection for current/future workflows.

1. Add a mode key in Python payload handling (e.g., `pipeline`, `mode`, or `chatMode`) with values:
   - `simple-chat`
   - `evaluate-simple`
   - `evaluate-with-rubric`
   - `bulk-evaluate`
2. Route `simple-chat` to the extracted simple pipeline.
3. Add placeholder handlers for the three evaluate modes:
   - return structured `PY_ACTION_FAILED` / “not implemented yet” responses
   - keep contract shape stable for future wiring.
4. Ensure backward compatibility:
   - if mode is omitted for current `llm.chat`/`llm.chatStream`, default to `simple-chat`.

Deliverables:
- Extensible mode router in `main.py`.
- Stubs for additional evaluate entry points (without full implementation).

---

## Phase 3 — Keep server warm and observable
**Goal:** prevent unnecessary runtime teardown and make warm-state behavior explicit.

1. Verify lifecycle persistence behavior in practice:
   - Python worker process stays alive across requests.
   - Runtime lifecycle cache is reused when `runtime_identity` doesn’t change.
2. Harden warm behavior in pipeline logic:
   - avoid creating ad hoc per-request runtime objects.
   - always go through `RuntimeLifecycle.get_or_create_llm_runtime`.
3. Add lightweight diagnostics/logging hooks (stderr-safe, never stdout JSON channel) for:
   - runtime cache hit/miss
   - server ensured running
   - shutdown reason.
4. Add tests (Python-side unit tests where practical) to assert repeated chats with unchanged config do not recreate runtime.

Deliverables:
- Confirmed/preserved warm server between chat turns.
- Tests covering cache reuse expectations.

---

## Phase 4 — Manual server switch-off action + shared contract
**Goal:** expose explicit shutdown capability on Python side and formalize contract in Electron shared layer.

1. Add new Python action entry point (example: `llm.serverControl`) with command payload supporting at least:
   - `shutdown`
2. Implement shutdown behavior:
   - call `runtime_lifecycle.shutdown()`
   - return success response indicating server/runtime stopped.
3. Add a new shared contract file in Electron:
   - `electron/shared/llm-server.ts`
   - include typed request/response envelopes for server control commands.
4. Wire orchestrator/shared types only (no renderer work):
   - extend allowed action union/types as needed.
   - keep existing chat contracts untouched.

Deliverables:
- Python manual shutdown action.
- `electron/shared/llm-server.ts` contract types.
- Electron service types updated to recognize server-control action.

---

## Phase 5 — Session memory design for simple-chat
**Goal:** evolve from one-shot prompt/response to persistent chat session memory.

1. Introduce session concept in payload:
   - `sessionId` optional input
   - server returns/echoes canonical session id.
2. Add in-process session store in Python pipeline (initial in-memory map):
   - key: `(runtime_identity, sessionId)`
   - value: ordered message history (role/content).
3. On each turn:
   - append user message
   - build prompt/context from session history
   - append assistant reply
4. Add lifecycle hooks:
   - explicit clear session command (future-compatible)
   - global session cleanup when runtime is manually shut down.
5. Guardrails:
   - configurable max turns/tokens retained
   - eviction policy (LRU or TTL) for memory safety.

Deliverables:
- Technical design + implementation path for warm conversational memory.
- Backward compatibility for single-turn calls without `sessionId`.

---

## Suggested implementation sequence
1. Phase 1 refactor (extract pipeline + router).
2. Phase 2 mode entry points/stubs.
3. Phase 4 server shutdown contract + action (unblocks ops control early).
4. Phase 3 warm-runtime verification/tests.
5. Phase 5 session-memory implementation skeleton + tests.

---

## Validation checklist after implementation
- Electron chat still works for existing single-message flow.
- Streaming (`llm.chatStream`) still emits ordered `stream_start/chunk/done` events.
- Repeated requests with same config do not reinitialize runtime unnecessarily.
- Manual server shutdown action returns success and next chat reboots runtime cleanly.
- `evaluate-*` modes resolve to explicit “not implemented yet” without crashing.
- Shared contracts compile (`tsc`) with no renderer changes.
