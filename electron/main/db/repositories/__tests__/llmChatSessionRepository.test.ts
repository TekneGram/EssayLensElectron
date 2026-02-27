import { describe, expect, it } from 'vitest';
import { SQLiteClient } from '../../sqlite';
import { LlmChatSessionRepository } from '../llmChatSessionRepository';

describe('LlmChatSessionRepository', () => {
  it('creates, appends, lists, and clears session turns', async () => {
    const db = new SQLiteClient({ dbPath: ':memory:' });
    const nowIso = '2026-02-27T00:00:00.000Z';
    await db.run(
      `INSERT INTO entities (uuid, type, created_at)
       VALUES (?, 'file', ?);`,
      ['file-1', nowIso]
    );
    await db.run(
      `INSERT INTO filepath (uuid, path, created_at)
       VALUES (?, ?, ?);`,
      ['folder-1', '/tmp/folder', nowIso]
    );
    await db.run(
      `INSERT INTO filename (entity_uuid, filepath_uuid, append_path, file_name, created_at)
       VALUES (?, ?, NULL, ?, ?);`,
      ['file-1', 'folder-1', 'essay.docx', nowIso]
    );

    const repository = new LlmChatSessionRepository({
      db,
      now: () => nowIso,
      maxTurns: 2
    });

    await expect(repository.createSession('sess-1', 'file-1')).resolves.toEqual({
      sessionId: 'sess-1',
      fileEntityUuid: 'file-1'
    });
    await repository.appendTurnPair('sess-1', 'teacher-1', 'assistant-1', 'file-1');
    await repository.appendTurnPair('sess-1', 'teacher-2', 'assistant-2', 'file-1');
    await repository.appendTurnPair('sess-1', 'teacher-3', 'assistant-3', 'file-1');

    await expect(repository.listRecentTurns('sess-1', 'file-1')).resolves.toEqual([
      { role: 'teacher', content: 'teacher-2' },
      { role: 'assistant', content: 'assistant-2' },
      { role: 'teacher', content: 'teacher-3' },
      { role: 'assistant', content: 'assistant-3' }
    ]);
    await expect(repository.listRecentTurns('sess-1', 'file-2')).resolves.toEqual([]);

    await expect(repository.clearSession('sess-1')).resolves.toEqual({
      sessionId: 'sess-1',
      cleared: true
    });
    await expect(repository.listRecentTurns('sess-1', 'file-1')).resolves.toEqual([]);
  });
});
