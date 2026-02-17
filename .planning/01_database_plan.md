# Database plan for EssayLens
Database is sqlite3.
Database is accessed through electron's IPC.
Only electron is allowed to touch the database

## Table entities
```sql
CREATE TABLE entities (
    uuid TEXT PRIMARY KEY,
    type TEXT CHECK (type IN ('file', 'rubric')),
    created_at TEXT NOT NULL
);
```

## Table: filepath

```sql
CREATE TABLE filepath (
    uuid TEXT PRIMARY KEY,
    path TEXT NOT NULL,
    created_at TEXT NOT NULL
);
```
---
## Table: filename
```sql
CREATE TABLE filename (
    entity_uuid TEXT PRIMARY KEY,
    filepath_uuid TEXT NOT NULL,
    append_path TEXT,
    file_name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    checked_is_generated INTEGER NOT NULL DEFAULT 0 CHECK (checked_is_generated IN (0,1)),
    generated_at TEXT,
    FOREIGN KEY (entity_uuid) REFERENCES entities (uuid),
    FOREIGN KEY (filepath_uuid) REFERENCES filepath (uuid)
);
```
---
## Table: image
```sql
CREATE TABLE image (
    entity_uuid TEXT NOT NULL,
    to_text INTEGER NOT NULL DEFAULT 0 CHECK (to_text IN (0,1)),
    text TEXT,
    FOREIGN KEY (entity_uuid) REFERENCES filename (entity_uuid)
);
```
---
## Table: feedback
```sql
CREATE TABLE feedback (
    uuid TEXT PRIMARY KEY,
    entity_uuid TEXT NOT NULL,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('teacher-inline', 'teacher-block', 'LLM-inline', 'LLM-block')),
    text_span_start INTEGER,
    text_span_end INTEGER,
    title TEXT,
    comment TEXT,
    applied INTEGER NOT NULL DEFAULT 0 CHECK (applied IN (0,1)),
    created_at TEXT NOT NULL,
    FOREIGN KEY (entity_uuid) REFERENCES filename (entity_uuid)
);
```
---
## Table: rubrics
```sql
CREATE TABLE rubrics (
    entity_uuid TEXT PRIMARY KEY,
    name TEXT,
    type TEXT CHECK (type IN ('flat', 'detailed')),
    FOREIGN KEY (entity_uuid) REFERENCES entities (uuid)
);
```

## Table rubric_details
```sql
CREATE TABLE rubric_details (
    uuid TEXT PRIMARY KEY,
    entity_uuid TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    FOREIGN KEY (entity_uuid) REFERENCES rubrics (entity_uuid)
);
```

## Table: rubric_scores
```sql
CREATE TABLE rubric_scores (
    uuid TEXT PRIMARY KEY,
    details_uuid TEXT NOT NULL,
    score_values INTEGER NOT NULL,
    FOREIGN KEY (details_uuid) REFERENCES rubric_details (uuid)
);
```

## Table: file_rubric_instances
```sql
CREATE TABLE file_rubric_instances (
    uuid TEXT PRIMARY KEY,
    file_entity_uuid TEXT NOT NULL,
    rubric_entity_uuid TEXT NOT NULL,
    created_at TEXT NOT NULL,
    edited_at TEXT,
    FOREIGN KEY (file_entity_uuid) REFERENCES filename(entity_uuid),
    FOREIGN KEY (rubric_entity_uuid) REFERENCES rubrics(entity_uuid)
);
```
---
# Table: file_rubric_scores
```sql
CREATE TABLE file_rubric_scores (
    uuid TEXT PRIMARY KEY,
    rubric_instance_uuid TEXT NOT NULL,
    rubric_detail_uuid TEXT NOT NULL,
    assigned_score TEXT NOT NULL,
    created_at TEXT NOT NULL,
    edited_at TEXT,
    FOREIGN KEY (rubric_instance_uuid) REFERENCES file_rubric_instances(uuid) ON DELETE CASCADE,
    FOREIGN KEY (rubric_detail_uuid) REFERENCES rubric_details(uuid)
);
```



## Table: chats
```sql
CREATE TABLE chats (
    uuid TEXT PRIMARY KEY,
    entity_uuid TEXT NOT NULL,
    chat_role TEXT NOT NULL,
    chat_header TEXT,
    chat_content TEXT,
    created_at TEXT,
    FOREIGN KEY (entity_uuid) REFERENCES entities (uuid)
)
```

## Table: audit
```sql 
CREATE TABLE audit (
    uuid TEXT PRIMARY KEY,
    entity_uuid TEXT NULL,
    user_action TEXT NOT NULL CHECK (user_action IN ('chat-doc', 'attach-folder', 'add-block-comment', 'add-inline-comment', 'generate-llm-inline-comment', 'generate-llm-block-comment', 'attach-rubric', 'edit-rubric', 'create-new-rubric', 'score-with-rubric')),
    target_table TEXT NOT NULL,
    target_uuid TEXT NOT NULL,
    metadata TEXT,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (entity_uuid) REFERENCES entities (uuid)
);
```

## INDEXES
```sql
-- Heavy querying
CREATE INDEX idx_feedback_entity ON feedback(entity_uuid);
CREATE INDEX idx_chats_entity ON chats(entity_uuid);
CREATE INDEX idx_audit_entity ON audit(entity_uuid);
CREATE INDEX idx_filename_path ON filename(filepath_uuid);

-- Handling rubrics
CREATE INDEX idx_rubric_instances_file ON file_rubric_instances(file_entity_uuid);
CREATE INDEX idx_rubric_instances_rubric ON file_rubric_instances(rubric_entity_uuid);
CREATE INDEX idx_rubric_scores_instance ON file_rubric_scores(rubric_instance_uuid);
CREATE INDEX idx_rubric_scores_detail ON file_rubric_scores(rubric_detail_uuid);

-- enforce uniqueness; prevents two scores for same criterion in the same grading session
CREATE UNIQUE INDEX idx_unique_instance_detail ON file_rubric_scores(rubric_instance_uuid, rubric_detail_uuid);

-- For cleanup
CREATE INDEX idx_rubric_instances_file ON file_rubric_instances(file_entity_uuid);
CREATE INDEX idx_rubric_instances_rubric ON file_rubric_instances(rubric_entity_uuid);
CREATE INDEX idx_rubric_scores_instance ON file_rubric_scores(rubric_instance_uuid);
CREATE UNIQUE INDEX idx_unique_instance_detail ON file_rubric_scores(rubric_instance_uuid, rubric_detail_uuid);

-- For future heavy analytics
CREATE INDEX idx_rubric_scores_detail ON file_rubric_scores(rubric_detail_uuid);
```