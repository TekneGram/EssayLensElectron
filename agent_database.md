## Database Schema
SQLite schema is defined by migrations in `electron/main/db/migrations`. Only Electron/main process accesses the database.

### Core/workspace tables
```sql
CREATE TABLE entities (
  uuid TEXT PRIMARY KEY,
  type TEXT CHECK (type IN ('file', 'rubric')),
  created_at TEXT NOT NULL
);

CREATE TABLE filepath (
  uuid TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE filename (
  entity_uuid TEXT PRIMARY KEY,
  filepath_uuid TEXT NOT NULL,
  append_path TEXT,
  file_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  checked_is_generated INTEGER NOT NULL DEFAULT 0 CHECK (checked_is_generated IN (0, 1)),
  generated_at TEXT,
  FOREIGN KEY (entity_uuid) REFERENCES entities(uuid) ON DELETE CASCADE,
  FOREIGN KEY (filepath_uuid) REFERENCES filepath(uuid) ON DELETE CASCADE
);

CREATE TABLE image (
  entity_uuid TEXT NOT NULL,
  to_text INTEGER NOT NULL DEFAULT 0 CHECK (to_text IN (0, 1)),
  text TEXT,
  FOREIGN KEY (entity_uuid) REFERENCES filename(entity_uuid) ON DELETE CASCADE
);
```

### Feedback tables
```sql
CREATE TABLE feedback (
  uuid TEXT PRIMARY KEY,
  entity_uuid TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('teacher', 'llm')),
  kind TEXT NOT NULL CHECK (kind IN ('inline', 'block')),
  comment_text TEXT NOT NULL,
  exact_quote TEXT,
  prefix_text TEXT,
  suffix_text TEXT,
  applied INTEGER NOT NULL DEFAULT 0 CHECK (applied IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY (entity_uuid) REFERENCES filename(entity_uuid) ON DELETE CASCADE,
  CHECK (kind <> 'block' OR (exact_quote IS NULL AND prefix_text IS NULL AND suffix_text IS NULL))
);

CREATE TABLE feedback_anchors (
  feedback_uuid TEXT NOT NULL,
  anchor_kind TEXT NOT NULL CHECK (anchor_kind IN ('start', 'end')),
  part TEXT NOT NULL,
  paragraph_index INTEGER NOT NULL CHECK (paragraph_index >= 0),
  run_index INTEGER NOT NULL CHECK (run_index >= 0),
  text_node_index INTEGER NOT NULL CHECK (text_node_index >= 0) DEFAULT 0,
  char_offset INTEGER NOT NULL CHECK (char_offset >= 0),
  PRIMARY KEY (feedback_uuid, anchor_kind),
  FOREIGN KEY (feedback_uuid) REFERENCES feedback(uuid) ON DELETE CASCADE
);
```

### Rubric tables
```sql
CREATE TABLE rubrics (
  entity_uuid TEXT PRIMARY KEY,
  name TEXT,
  type TEXT CHECK (type IN ('flat', 'detailed')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0,1)),
  FOREIGN KEY (entity_uuid) REFERENCES entities(uuid) ON DELETE CASCADE
);

CREATE TABLE rubric_details (
  uuid TEXT PRIMARY KEY,
  entity_uuid TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  FOREIGN KEY (entity_uuid) REFERENCES rubrics(entity_uuid) ON DELETE CASCADE
);

CREATE TABLE rubric_scores (
  uuid TEXT PRIMARY KEY,
  details_uuid TEXT NOT NULL,
  score_values INTEGER NOT NULL,
  FOREIGN KEY (details_uuid) REFERENCES rubric_details(uuid) ON DELETE CASCADE
);

CREATE TABLE file_rubric_instances (
  uuid TEXT PRIMARY KEY,
  file_entity_uuid TEXT NOT NULL,
  rubric_entity_uuid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  edited_at TEXT,
  FOREIGN KEY (file_entity_uuid) REFERENCES filename(entity_uuid) ON DELETE CASCADE,
  FOREIGN KEY (rubric_entity_uuid) REFERENCES rubrics(entity_uuid) ON DELETE RESTRICT
);

CREATE TABLE file_rubric_scores (
  uuid TEXT PRIMARY KEY,
  rubric_instance_uuid TEXT NOT NULL,
  rubric_detail_uuid TEXT NOT NULL,
  assigned_score TEXT NOT NULL,
  created_at TEXT NOT NULL,
  edited_at TEXT,
  FOREIGN KEY (rubric_instance_uuid) REFERENCES file_rubric_instances(uuid) ON DELETE CASCADE,
  FOREIGN KEY (rubric_detail_uuid) REFERENCES rubric_details(uuid) ON DELETE RESTRICT
);

CREATE TABLE rubric_last_used (
  profile_key TEXT PRIMARY KEY,
  rubric_entity_uuid TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (rubric_entity_uuid) REFERENCES rubrics(entity_uuid) ON DELETE CASCADE
);

CREATE TABLE filepath_rubric_associations (
  filepath_uuid TEXT PRIMARY KEY,
  rubric_entity_uuid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  edited_at TEXT,
  FOREIGN KEY (filepath_uuid) REFERENCES filepath(uuid) ON DELETE CASCADE,
  FOREIGN KEY (rubric_entity_uuid) REFERENCES rubrics(entity_uuid) ON DELETE RESTRICT
);
```

### Chat/audit tables
```sql
CREATE TABLE chats (
  uuid TEXT PRIMARY KEY,
  entity_uuid TEXT NOT NULL,
  chat_role TEXT NOT NULL,
  chat_header TEXT,
  chat_content TEXT,
  created_at TEXT,
  FOREIGN KEY (entity_uuid) REFERENCES entities(uuid) ON DELETE CASCADE
);

CREATE TABLE audit (
  uuid TEXT PRIMARY KEY,
  entity_uuid TEXT NULL,
  user_action TEXT NOT NULL CHECK (
    user_action IN (
      'chat-doc',
      'attach-folder',
      'add-block-comment',
      'add-inline-comment',
      'generate-llm-inline-comment',
      'generate-llm-block-comment',
      'attach-rubric',
      'edit-rubric',
      'create-new-rubric',
      'score-with-rubric'
    )
  ),
  target_table TEXT NOT NULL,
  target_uuid TEXT NOT NULL,
  metadata TEXT,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (entity_uuid) REFERENCES entities(uuid)
);
```

### LLM runtime tables
```sql
CREATE TABLE llm_settings (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  llm_server_path TEXT NOT NULL,
  llm_gguf_path TEXT,
  llm_mmproj_path TEXT,
  llm_server_url TEXT NOT NULL,
  llm_host TEXT NOT NULL,
  llm_port INTEGER NOT NULL,
  llm_n_ctx INTEGER NOT NULL,
  llm_n_threads INTEGER,
  llm_n_gpu_layers INTEGER,
  llm_n_batch INTEGER,
  llm_n_parallel INTEGER,
  llm_seed INTEGER,
  llm_rope_freq_base REAL,
  llm_rope_freq_scale REAL,
  llm_use_jinja INTEGER NOT NULL CHECK (llm_use_jinja IN (0, 1)),
  llm_cache_prompt INTEGER NOT NULL CHECK (llm_cache_prompt IN (0, 1)),
  llm_flash_attn INTEGER NOT NULL CHECK (llm_flash_attn IN (0, 1)),
  max_tokens INTEGER NOT NULL,
  temperature REAL NOT NULL,
  top_p REAL,
  top_k INTEGER,
  repeat_penalty REAL,
  request_seed INTEGER,
  use_fake_reply INTEGER NOT NULL CHECK (use_fake_reply IN (0, 1)),
  fake_reply_text TEXT
);

CREATE TABLE llm_selection_defaults (
  model_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  hf_repo_id TEXT NOT NULL,
  hf_filename TEXT NOT NULL,
  mmproj_filename TEXT,
  backend TEXT NOT NULL CHECK (backend IN ('server')),
  model_family TEXT NOT NULL,
  llm_server_path TEXT NOT NULL,
  llm_gguf_path TEXT,
  llm_mmproj_path TEXT,
  llm_server_url TEXT NOT NULL,
  llm_host TEXT NOT NULL,
  llm_port INTEGER NOT NULL,
  llm_n_ctx INTEGER NOT NULL,
  llm_n_threads INTEGER,
  llm_n_gpu_layers INTEGER,
  llm_n_batch INTEGER,
  llm_n_parallel INTEGER,
  llm_seed INTEGER,
  llm_rope_freq_base REAL,
  llm_rope_freq_scale REAL,
  llm_use_jinja INTEGER NOT NULL CHECK (llm_use_jinja IN (0, 1)),
  llm_cache_prompt INTEGER NOT NULL CHECK (llm_cache_prompt IN (0, 1)),
  llm_flash_attn INTEGER NOT NULL CHECK (llm_flash_attn IN (0, 1)),
  max_tokens INTEGER NOT NULL,
  temperature REAL NOT NULL,
  top_p REAL,
  top_k INTEGER,
  repeat_penalty REAL,
  request_seed INTEGER,
  use_fake_reply INTEGER NOT NULL CHECK (use_fake_reply IN (0, 1)),
  fake_reply_text TEXT
);

CREATE TABLE llm_selection (
  model_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  local_gguf_path TEXT NOT NULL,
  local_mmproj_path TEXT,
  downloaded_at TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
  FOREIGN KEY (model_key) REFERENCES llm_selection_defaults(model_key) ON DELETE RESTRICT ON UPDATE CASCADE
);
```

### Indexes and triggers (current)
```sql
CREATE INDEX idx_chats_entity ON chats(entity_uuid);
CREATE INDEX idx_audit_entity ON audit(entity_uuid);
CREATE INDEX idx_filename_path ON filename(filepath_uuid);
CREATE UNIQUE INDEX idx_filepath_path_unique ON filepath(path);
CREATE UNIQUE INDEX idx_filename_folder_rel_unique ON filename(filepath_uuid, IFNULL(append_path, ''), file_name);

CREATE INDEX idx_feedback_entity ON feedback(entity_uuid);
CREATE INDEX idx_feedback_anchor_lookup ON feedback_anchors(part, paragraph_index, run_index, char_offset);

CREATE INDEX idx_rubric_instances_file ON file_rubric_instances(file_entity_uuid);
CREATE INDEX idx_rubric_instances_rubric ON file_rubric_instances(rubric_entity_uuid);
CREATE INDEX idx_rubric_scores_instance ON file_rubric_scores(rubric_instance_uuid);
CREATE INDEX idx_rubric_scores_detail ON file_rubric_scores(rubric_detail_uuid);
CREATE UNIQUE INDEX idx_unique_instance_detail ON file_rubric_scores(rubric_instance_uuid, rubric_detail_uuid);
CREATE INDEX idx_rubrics_archived_name ON rubrics(is_archived, name COLLATE NOCASE);
CREATE INDEX idx_filepath_rubric_associations_rubric ON filepath_rubric_associations(rubric_entity_uuid);

CREATE UNIQUE INDEX idx_llm_selection_single_active ON llm_selection(is_active) WHERE is_active = 1;
CREATE INDEX idx_llm_selection_downloaded_at ON llm_selection(downloaded_at);
```

```sql
CREATE TRIGGER trg_feedback_anchor_requires_inline_insert
BEFORE INSERT ON feedback_anchors
FOR EACH ROW
WHEN (SELECT kind FROM feedback WHERE uuid = NEW.feedback_uuid) <> 'inline'
BEGIN
  SELECT RAISE(ABORT, 'ANCHOR_REQUIRES_INLINE_FEEDBACK');
END;

CREATE TRIGGER trg_feedback_anchor_requires_inline_update
BEFORE UPDATE OF feedback_uuid ON feedback_anchors
FOR EACH ROW
WHEN (SELECT kind FROM feedback WHERE uuid = NEW.feedback_uuid) <> 'inline'
BEGIN
  SELECT RAISE(ABORT, 'ANCHOR_REQUIRES_INLINE_FEEDBACK');
END;

CREATE TRIGGER trg_feedback_block_cannot_keep_anchors
BEFORE UPDATE OF kind ON feedback
FOR EACH ROW
WHEN NEW.kind = 'block'
  AND EXISTS (SELECT 1 FROM feedback_anchors fa WHERE fa.feedback_uuid = NEW.uuid)
BEGIN
  SELECT RAISE(ABORT, 'BLOCK_FEEDBACK_CANNOT_RETAIN_ANCHORS');
END;
```

Note: SQLite also maintains `_migrations` (created by `SQLiteClient`) to track applied migration files.
