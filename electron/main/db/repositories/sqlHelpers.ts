import path from 'node:path';
import type { SQLiteClient } from '../sqlite';

export const GLOBAL_CHAT_ENTITY_ID = '__global_chat__';

export async function ensureEntity(
  db: SQLiteClient,
  entityId: string,
  entityType: 'file' | 'rubric',
  nowIso: string
): Promise<void> {
  await db.run(
    'INSERT INTO entities (uuid, type, created_at) VALUES (?, ?, ?) ON CONFLICT(uuid) DO NOTHING;',
    [entityId, entityType, nowIso]
  );
}

export async function ensureFileRecord(db: SQLiteClient, fileId: string, nowIso: string): Promise<void> {
  const normalizedFileId = fileId.trim();
  if (!normalizedFileId) {
    throw new Error('File id is required.');
  }

  const folderPath = path.dirname(normalizedFileId);
  const fileName = path.basename(normalizedFileId);

  await ensureEntity(db, normalizedFileId, 'file', nowIso);
  await db.run(
    'INSERT INTO filepath (uuid, path, created_at) VALUES (?, ?, ?) ON CONFLICT(uuid) DO NOTHING;',
    [folderPath, folderPath, nowIso]
  );
  await db.run(
    `INSERT INTO filename (entity_uuid, filepath_uuid, append_path, file_name, created_at)
     VALUES (?, ?, NULL, ?, ?)
     ON CONFLICT(entity_uuid)
     DO UPDATE SET filepath_uuid = excluded.filepath_uuid, file_name = excluded.file_name;`,
    [normalizedFileId, folderPath, fileName, nowIso]
  );
}

export async function ensureGlobalChatEntity(db: SQLiteClient, nowIso: string): Promise<void> {
  await ensureEntity(db, GLOBAL_CHAT_ENTITY_ID, 'file', nowIso);
}
