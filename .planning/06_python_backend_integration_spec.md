# Python Backend Integration Spec (Round 1)

## Purpose
Define the minimal integration contract between Electron main and the spawned Python worker for first-round implementation.

## Boundary Rules
- Renderer never calls Python directly.
- Renderer calls typed IPC (`window.api.*`).
- Electron main process owns Python spawn, lifecycle, and request routing.

## Process Model
- Python worker is started by Electron main at app startup (or lazily on first LLM request).
- Main tracks worker health and restart policy.
- Main shuts down worker gracefully on app quit.

## Transport (Round 1)
- Use stdin/stdout JSON message exchange (or equivalent IPC channel).
- One request produces one response with matching `requestId`.

## Request Envelope

```ts
interface PythonRequest<TPayload = unknown> {
  requestId: string;
  action:
    | 'llm.assessEssay'
    | 'llm.chat'
    | 'llm.generateFeedbackSummary';
  payload: TPayload;
  timestamp: string;
}
```

## Response Envelope

```ts
interface PythonSuccess<TData = unknown> {
  requestId: string;
  ok: true;
  data: TData;
  timestamp: string;
}

interface PythonFailure {
  requestId: string;
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

type PythonResponse<TData = unknown> = PythonSuccess<TData> | PythonFailure;
```

## Main Process Responsibilities
- Validate outbound payload shape before sending to Python.
- Enforce request timeouts.
- Normalize Python errors into app error format.
- Persist resulting chat/feedback updates via repositories.
- Return final normalized result to renderer via IPC.

## Timeout and Retry Policy (Round 1)
- Default timeout per Python request: 60s.
- On timeout:
  - mark request failed,
  - return normalized timeout error,
  - keep app responsive.
- Retry policy: no automatic retry by default (manual retry via UI action).

## Observability
- Main logs request lifecycle (`requestId`, action, duration, outcome).
- Do not log essay full text or sensitive user content in production logs.

## Security / Safety Baseline
- Strictly whitelist supported `action` values.
- Reject unknown actions/payloads.
- Sanitize strings passed across process boundary where necessary.

## Round 1 Action Contracts

### `llm.assessEssay`
Input:
- `fileId: string`
- `text: string`
- `instruction?: string`

Output:
- `comments: Array<{ content: string; kind: 'inline' | 'block' }>`
- `summary?: string`

### `llm.chat`
Input:
- `fileId?: string`
- `message: string`
- `contextText?: string`

Output:
- `reply: string`

## Failure Mapping (Main -> Renderer)
Map Python/system failures to normalized app codes:
- `PY_TIMEOUT`
- `PY_PROCESS_DOWN`
- `PY_INVALID_RESPONSE`
- `PY_ACTION_FAILED`

Renderer displays user-facing message via Toastify; detailed diagnostics remain in main logs.

## Acceptance Criteria
- Main can start and stop Python worker reliably.
- A test IPC call reaches Python and returns a normalized response.
- Timeout and malformed-response paths return normalized errors.
- Renderer receives only normalized IPC results, never raw Python protocol artifacts.
