import { getSharedDatabaseClient } from '../appDatabase';
import type { SQLiteClient } from '../sqlite';

export interface RubricSummaryRecord {
  id: string;
  name: string;
  description?: string;
}

export interface RubricMatrixRecord {
  rubricId: string;
}

interface RubricRepositoryOptions {
  db?: SQLiteClient;
}

interface RubricRow {
  entity_uuid: string;
  name: string | null;
}

export class RubricRepository {
  private readonly db: SQLiteClient;

  constructor(options: RubricRepositoryOptions = {}) {
    this.db = options.db ?? getSharedDatabaseClient();
  }

  async listRubrics(): Promise<RubricSummaryRecord[]> {
    const rows = await this.db.all<RubricRow>(
      `SELECT entity_uuid, name
       FROM rubrics
       ORDER BY name COLLATE NOCASE ASC, entity_uuid ASC;`
    );

    return rows.map((row) => ({
      id: row.entity_uuid,
      name: row.name ?? 'Untitled rubric'
    }));
  }

  async getRubricMatrix(rubricId: string): Promise<RubricMatrixRecord | null> {
    const row = await this.db.get<RubricRow>(
      'SELECT entity_uuid, name FROM rubrics WHERE entity_uuid = ? LIMIT 1;',
      [rubricId]
    );
    if (!row) {
      return null;
    }

    return {
      rubricId: row.entity_uuid
    };
  }
}
