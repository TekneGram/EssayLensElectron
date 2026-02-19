# Phase 3 Report: DB Schema + Migration for Feedback Anchors

## Completed
- Added Phase 3 migration SQL:
  - `electron/main/db/migrations/0003_feedback_anchors.sql`
- Added Phase 3 sample seed/query SQL:
  - `electron/main/db/seeds/phase3_feedback_sample.sql`
- Extended DB client scaffolding to discover and load SQL migrations in deterministic order:
  - `electron/main/db/sqlite.ts`
- Added migration loader unit test:
  - `electron/main/db/__tests__/sqlite.test.ts`

## Schema + Migration Implemented
### `feedback`
- Added table with fields aligned to assessment contract expectations:
  - `uuid`, `entity_uuid`, `source`, `kind`, `comment_text`, `exact_quote`, `prefix_text`, `suffix_text`, `applied`, `created_at`, `updated_at`
- Constraints:
  - `source` limited to `'teacher' | 'llm'`
  - `kind` limited to `'inline' | 'block'`
  - `applied` limited to `0 | 1`
  - block comments cannot retain inline quote context (`exact_quote`, `prefix_text`, `suffix_text` must be `NULL` when `kind='block'`)
- FK:
  - `entity_uuid -> filename(entity_uuid)` with `ON DELETE CASCADE`

### `feedback_anchor`
- Added normalized anchor table:
  - `feedback_uuid`, `anchor_kind`, `part`, `paragraph_index`, `run_index`, `char_offset`
- Constraints:
  - `anchor_kind` limited to `'start' | 'end'`
  - index fields are integer and non-negative via `CHECK (>= 0)`
- PK/FK:
  - `PRIMARY KEY (feedback_uuid, anchor_kind)`
  - `feedback_uuid -> feedback(uuid)` with `ON DELETE CASCADE`

### Indexes
- Added required index for feedback-by-file retrieval:
  - `idx_feedback_entity_uuid` on `feedback(entity_uuid)`
- Added anchor lookup index:
  - `idx_feedback_anchor_lookup` on `(part, paragraph_index, run_index, char_offset)`

## DB-Level Invariants Added
- Anchors only attach to inline feedback:
  - trigger `trg_feedback_anchor_requires_inline_insert`
  - trigger `trg_feedback_anchor_requires_inline_update`
- Block comments cannot retain anchors:
  - trigger `trg_feedback_block_cannot_keep_anchors`
- Kept “inline must have both anchors” as an API/repository transaction invariant (not forced as an immediate DB `CHECK`).

## Sample Data + Queryability
- Added realistic seed rows for:
  - one inline teacher feedback with both `start` and `end` anchors
  - one block LLM feedback
- Included query example joining `feedback` and `feedback_anchor` for file-scoped retrieval.

## Verification
- `npm run -s typecheck` (pass)
- `npx vitest run electron/main/db/__tests__/sqlite.test.ts electron/main/ipc/__tests__/assessmentHandlers.test.ts electron/main/ipc/__tests__/registerHandlers.test.ts` (pass)
- Manual sqlite validation:
  - migration + seed produce queryable rows
  - invalid anchor insertion for block feedback fails with `ANCHOR_REQUIRES_INLINE_FEEDBACK`
  - invalid inline->block update with existing anchors fails with `BLOCK_FEEDBACK_CANNOT_RETAIN_ANCHORS`

## Handoff
- Phase 3 scope is complete: normalized feedback persistence schema with anchor support is defined via migration SQL and verified with realistic sample data and invariant checks.
- Phase 4 can now implement repository transaction mapping (`listByFileId` + `add`) against this schema.
