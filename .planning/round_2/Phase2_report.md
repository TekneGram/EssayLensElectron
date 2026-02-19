# Phase 2 Report: API Boundary Validation Rules

## Completed
- Implemented strict IPC payload validation and normalization in:
  - `electron/main/ipc/assessmentHandlers.ts`
- Added endpoint-specific request validators for:
  - `assessment/extractDocument`
  - `assessment/listFeedback`
  - `assessment/addFeedback`
  - `assessment/requestLlmAssessment`

## Validation Rules Added
- `fileId` must be a non-empty string where required.
- `addFeedback` enforces:
  - `kind` must be `'inline'` or `'block'`
  - `source` must be `'teacher'` or `'llm'`
  - required scalar fields (`fileId`, `commentText`) must be valid non-empty strings
  - inline payloads must include `exactQuote`, `prefixText`, `suffixText`, `startAnchor`, `endAnchor`
  - block payloads reject all inline-only fields (`exactQuote`, `prefixText`, `suffixText`, `startAnchor`, `endAnchor`)
  - anchor fields must be integers and `>= 0` (`paragraphIndex`, `runIndex`, `charOffset`)
  - optional anchor order guard: when `startAnchor.part === endAnchor.part`, start cannot be after end
- `requestLlmAssessment` accepts optional string `instruction` and trims it; empty instruction normalizes to `undefined`.

## Error Normalization
- Invalid payloads now return consistent `AppError` codes:
  - `ASSESSMENT_EXTRACT_DOCUMENT_INVALID_PAYLOAD`
  - `ASSESSMENT_LIST_FEEDBACK_INVALID_PAYLOAD`
  - `ASSESSMENT_ADD_FEEDBACK_INVALID_PAYLOAD`
  - `ASSESSMENT_REQUEST_LLM_ASSESSMENT_INVALID_PAYLOAD`

## Tests Added
- New test file:
  - `electron/main/ipc/__tests__/assessmentHandlers.test.ts`
- Coverage includes:
  - malformed `listFeedback` payload rejection
  - inline missing required fields rejection
  - block with inline-only fields rejection
  - invalid anchor integer/negative rejection
  - anchor ordering rejection (`start > end` within same part)
  - valid payloads pass validation and continue to current phase behavior (`NOT_IMPLEMENTED`)

## Verification
- `npm run -s typecheck` (pass)
- `npx vitest run electron/main/ipc/__tests__/assessmentHandlers.test.ts electron/main/ipc/__tests__/registerHandlers.test.ts` (pass)

## Handoff
- Phase 2 scope is complete: malformed assessment IPC payloads are rejected consistently at the boundary before repository/DB execution.
- Next phase (Phase 3) can focus on DB schema + migration for feedback anchors.
