import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { SQLiteClient } from '../sqlite';

describe('SQLiteClient migration loading', () => {
  it('loads SQL migrations in sorted order', () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'essaylens-migrations-'));

    try {
      writeFileSync(path.join(tempDir, '002_second.sql'), 'SELECT 2;', 'utf8');
      writeFileSync(path.join(tempDir, '001_first.sql'), 'SELECT 1;', 'utf8');
      writeFileSync(path.join(tempDir, 'readme.txt'), 'ignore', 'utf8');

      const client = new SQLiteClient({ dbPath: ':memory:', migrationsDir: tempDir });
      const migrations = client.loadMigrations();

      expect(migrations.map((migration) => migration.id)).toEqual(['001_first', '002_second']);
      expect(migrations.map((migration) => migration.sql.trim())).toEqual(['SELECT 1;', 'SELECT 2;']);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
