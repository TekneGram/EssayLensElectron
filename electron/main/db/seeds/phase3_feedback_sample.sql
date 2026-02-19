PRAGMA foreign_keys = ON;

-- Minimal parent table required by feedback FK for local verification/demo.
CREATE TABLE IF NOT EXISTS filename (
  entity_uuid TEXT PRIMARY KEY
);

INSERT INTO filename(entity_uuid)
VALUES ('file-alpha')
ON CONFLICT(entity_uuid) DO NOTHING;

INSERT INTO feedback (
  uuid,
  entity_uuid,
  source,
  kind,
  comment_text,
  exact_quote,
  prefix_text,
  suffix_text,
  applied,
  created_at,
  updated_at
) VALUES (
  'feedback-inline-1',
  'file-alpha',
  'teacher',
  'inline',
  'Use a more formal transition phrase in this sentence.',
  'in my opinion',
  'However, ',
  ', this can be stated more objectively.',
  0,
  '2026-02-19T00:00:00.000Z',
  NULL
);

INSERT INTO feedback_anchor (
  feedback_uuid,
  anchor_kind,
  part,
  paragraph_index,
  run_index,
  char_offset
) VALUES
  ('feedback-inline-1', 'start', 'body', 2, 0, 5),
  ('feedback-inline-1', 'end', 'body', 2, 0, 18);

INSERT INTO feedback (
  uuid,
  entity_uuid,
  source,
  kind,
  comment_text,
  applied,
  created_at,
  updated_at
) VALUES (
  'feedback-block-1',
  'file-alpha',
  'llm',
  'block',
  'Your conclusion summarizes key points well. Add one sentence about future impact.',
  1,
  '2026-02-19T00:10:00.000Z',
  '2026-02-19T00:12:00.000Z'
);

-- Query example for Phase 4 repository mapping.
SELECT
  f.uuid,
  f.entity_uuid,
  f.source,
  f.kind,
  f.comment_text,
  f.exact_quote,
  f.prefix_text,
  f.suffix_text,
  f.applied,
  f.created_at,
  f.updated_at,
  a.anchor_kind,
  a.part,
  a.paragraph_index,
  a.run_index,
  a.char_offset
FROM feedback f
LEFT JOIN feedback_anchor a ON a.feedback_uuid = f.uuid
WHERE f.entity_uuid = 'file-alpha'
ORDER BY f.created_at ASC, a.anchor_kind ASC;
