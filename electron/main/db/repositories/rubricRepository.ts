import { getSharedDatabaseClient } from '../appDatabase';
import { randomUUID } from 'node:crypto';
import type { SQLiteClient } from '../sqlite';
import { ensureEntity, ensureFileRecord } from './sqlHelpers';
import type {
  FileRubricInstanceDto,
  FileRubricScoreDto,
  GetRubricMatrixResponse,
  RubricDetailDto,
  RubricDto,
  RubricScoreDto,
  UpdateRubricOperation
} from '../../../shared/rubricContracts';

interface RubricRepositoryOptions {
  now?: () => string;
  db?: SQLiteClient;
}

interface RubricRow {
  entity_uuid: string;
  name: string | null;
  type: 'flat' | 'detailed' | null;
}

interface RubricDetailRow {
  uuid: string;
  entity_uuid: string;
  category: string;
  description: string;
}

interface RubricScoreRow {
  uuid: string;
  details_uuid: string;
  score_values: number;
}

interface RubricInstanceRow {
  uuid: string;
  file_entity_uuid: string;
  rubric_entity_uuid: string;
  created_at: string;
  edited_at: string | null;
}

interface RubricInstanceScoreRow {
  uuid: string;
  rubric_instance_uuid: string;
  rubric_detail_uuid: string;
  assigned_score: string;
  created_at: string;
  edited_at: string | null;
}

interface RubricLastUsedRow {
  profile_key: string;
  rubric_entity_uuid: string;
  updated_at: string;
}

export class RubricRepository {
  private readonly db: SQLiteClient;
  private readonly now: () => string;

  constructor(options: RubricRepositoryOptions = {}) {
    this.db = options.db ?? getSharedDatabaseClient();
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async listRubrics(): Promise<RubricDto[]> {
    const rows = await this.db.all<RubricRow>(
      `SELECT entity_uuid, name, type
       FROM rubrics
       ORDER BY name COLLATE NOCASE ASC, entity_uuid ASC;`
    );

    return rows.map((row) => ({
      entityUuid: row.entity_uuid,
      name: row.name ?? 'Untitled rubric',
      type: row.type ?? 'detailed'
    }));
  }

  async createRubric(name = 'New Rubric', profileKey = 'default'): Promise<string> {
    const nowIso = this.now();
    const rubricId = randomUUID();
    const rubricName = name.trim() || 'New Rubric';
    const categoryNames = ['Category 1', 'Category 2', 'Category 3'];
    const scoreValues = [5, 4, 3, 2, 1];

    await this.db.exec('BEGIN;');
    try {
      await ensureEntity(this.db, rubricId, 'rubric', nowIso);
      await this.db.run(
        `INSERT INTO rubrics (entity_uuid, name, type)
         VALUES (?, ?, 'detailed');`,
        [rubricId, rubricName]
      );

      for (const categoryName of categoryNames) {
        for (const scoreValue of scoreValues) {
          const detailId = randomUUID();
          await this.db.run(
            `INSERT INTO rubric_details (uuid, entity_uuid, category, description)
             VALUES (?, ?, ?, ?);`,
            [detailId, rubricId, categoryName, `${categoryName} at ${scoreValue} points`]
          );
          await this.db.run(
            `INSERT INTO rubric_scores (uuid, details_uuid, score_values)
             VALUES (?, ?, ?);`,
            [randomUUID(), detailId, scoreValue]
          );
        }
      }

      await this.db.run(
        `INSERT INTO rubric_last_used (profile_key, rubric_entity_uuid, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(profile_key)
         DO UPDATE SET rubric_entity_uuid = excluded.rubric_entity_uuid, updated_at = excluded.updated_at;`,
        [profileKey, rubricId, nowIso]
      );

      await this.db.exec('COMMIT;');
      return rubricId;
    } catch (error) {
      await this.db.exec('ROLLBACK;');
      throw error;
    }
  }

  async getLastUsedRubricId(profileKey = 'default'): Promise<string | null> {
    const row = await this.db.get<RubricLastUsedRow>(
      `SELECT profile_key, rubric_entity_uuid, updated_at
       FROM rubric_last_used
       WHERE profile_key = ?
       LIMIT 1;`,
      [profileKey]
    );
    if (!row) {
      return null;
    }
    return row.rubric_entity_uuid;
  }

  async setLastUsedRubricId(rubricId: string, profileKey = 'default'): Promise<boolean> {
    const existingRubric = await this.db.get<{ entity_uuid: string }>(
      'SELECT entity_uuid FROM rubrics WHERE entity_uuid = ? LIMIT 1;',
      [rubricId]
    );
    if (!existingRubric) {
      return false;
    }

    const nowIso = this.now();
    await this.db.run(
      `INSERT INTO rubric_last_used (profile_key, rubric_entity_uuid, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(profile_key)
       DO UPDATE SET rubric_entity_uuid = excluded.rubric_entity_uuid, updated_at = excluded.updated_at;`,
      [profileKey, rubricId, nowIso]
    );
    return true;
  }

  async getRubricMatrix(rubricId: string): Promise<GetRubricMatrixResponse | null> {
    const row = await this.db.get<RubricRow>(
      'SELECT entity_uuid, name, type FROM rubrics WHERE entity_uuid = ? LIMIT 1;',
      [rubricId]
    );
    if (!row) {
      return null;
    }

    const details = await this.db.all<RubricDetailRow>(
      `SELECT uuid, entity_uuid, category, description
       FROM rubric_details
       WHERE entity_uuid = ?
       ORDER BY category COLLATE NOCASE ASC, uuid ASC;`,
      [rubricId]
    );
    const detailIds = details.map((detail) => detail.uuid);
    let scores: RubricScoreRow[] = [];
    if (detailIds.length > 0) {
      const placeholders = detailIds.map(() => '?').join(', ');
      scores = await this.db.all<RubricScoreRow>(
        `SELECT uuid, details_uuid, score_values
         FROM rubric_scores
         WHERE details_uuid IN (${placeholders})
         ORDER BY score_values DESC, uuid ASC;`,
        detailIds
      );
    }

    return {
      rubric: {
        entityUuid: row.entity_uuid,
        name: row.name ?? 'Untitled rubric',
        type: row.type ?? 'detailed'
      },
      details: details.map((detail): RubricDetailDto => ({
        uuid: detail.uuid,
        entityUuid: detail.entity_uuid,
        category: detail.category,
        description: detail.description
      })),
      scores: scores.map((score): RubricScoreDto => ({
        uuid: score.uuid,
        detailsUuid: score.details_uuid,
        scoreValues: score.score_values
      }))
    };
  }

  async updateRubricMatrix(rubricId: string, operation: UpdateRubricOperation): Promise<boolean> {
    const existingRubric = await this.db.get<{ entity_uuid: string }>(
      'SELECT entity_uuid FROM rubrics WHERE entity_uuid = ? LIMIT 1;',
      [rubricId]
    );
    if (!existingRubric) {
      return false;
    }

    const nowIso = this.now();
    await this.db.exec('BEGIN;');
    try {
      if (operation.type === 'setRubricName') {
        await this.db.run('UPDATE rubrics SET name = ? WHERE entity_uuid = ?;', [operation.name, rubricId]);
      }

      if (operation.type === 'updateCellDescription') {
        await this.db.run(
          `UPDATE rubric_details
           SET description = ?
           WHERE uuid = ?
             AND entity_uuid = ?;`,
          [operation.description, operation.detailId, rubricId]
        );
      }

      if (operation.type === 'updateCategoryName') {
        await this.db.run(
          `UPDATE rubric_details
           SET category = ?
           WHERE entity_uuid = ?
             AND category = ?;`,
          [operation.to, rubricId, operation.from]
        );
      }

      if (operation.type === 'updateScoreValue') {
        await this.db.run(
          `UPDATE rubric_scores
           SET score_values = ?
           WHERE details_uuid IN (
             SELECT uuid
             FROM rubric_details
             WHERE entity_uuid = ?
           )
             AND score_values = ?;`,
          [operation.to, rubricId, operation.from]
        );
      }

      if (operation.type === 'createCategory') {
        const scoreRows = await this.db.all<{ score_values: number }>(
          `SELECT DISTINCT rs.score_values
           FROM rubric_scores rs
           INNER JOIN rubric_details rd ON rd.uuid = rs.details_uuid
           WHERE rd.entity_uuid = ?
           ORDER BY rs.score_values DESC;`,
          [rubricId]
        );
        const scoreValues = scoreRows.map((row) => row.score_values);

        for (const scoreValue of scoreValues) {
          const detailId = randomUUID();
          await this.db.run(
            `INSERT INTO rubric_details (uuid, entity_uuid, category, description)
             VALUES (?, ?, ?, ?);`,
            [detailId, rubricId, operation.name, '']
          );
          await this.db.run(
            `INSERT INTO rubric_scores (uuid, details_uuid, score_values)
             VALUES (?, ?, ?);`,
            [randomUUID(), detailId, scoreValue]
          );
        }
      }

      if (operation.type === 'createScore') {
        const categoryRows = await this.db.all<{ category: string }>(
          `SELECT DISTINCT category
           FROM rubric_details
           WHERE entity_uuid = ?
           ORDER BY category COLLATE NOCASE ASC;`,
          [rubricId]
        );
        for (const categoryRow of categoryRows) {
          const detailId = randomUUID();
          await this.db.run(
            `INSERT INTO rubric_details (uuid, entity_uuid, category, description)
             VALUES (?, ?, ?, ?);`,
            [detailId, rubricId, categoryRow.category, '']
          );
          await this.db.run(
            `INSERT INTO rubric_scores (uuid, details_uuid, score_values)
             VALUES (?, ?, ?);`,
            [randomUUID(), detailId, operation.value]
          );
        }
      }

      if (operation.type === 'deleteCategory') {
        const detailRows = await this.db.all<{ uuid: string }>(
          `SELECT uuid
           FROM rubric_details
           WHERE entity_uuid = ? AND category = ?;`,
          [rubricId, operation.category]
        );
        const detailIds = detailRows.map((row) => row.uuid);
        if (detailIds.length > 0) {
          const placeholders = detailIds.map(() => '?').join(', ');
          await this.db.run(
            `DELETE FROM rubric_scores
             WHERE details_uuid IN (${placeholders});`,
            detailIds
          );
          await this.db.run(
            `DELETE FROM rubric_details
             WHERE uuid IN (${placeholders});`,
            detailIds
          );
        }
      }

      if (operation.type === 'deleteScore') {
        await this.db.run(
          `DELETE FROM rubric_scores
           WHERE details_uuid IN (
             SELECT uuid
             FROM rubric_details
             WHERE entity_uuid = ?
           )
             AND score_values = ?;`,
          [rubricId, operation.value]
        );
        await this.db.run(
          `DELETE FROM rubric_details
           WHERE entity_uuid = ?
             AND uuid NOT IN (
               SELECT DISTINCT details_uuid
               FROM rubric_scores
             );`,
          [rubricId]
        );
      }

      await this.db.exec('COMMIT;');
      return true;
    } catch (error) {
      await this.db.exec('ROLLBACK;');
      throw error;
    }
  }

  async getFileRubricScores(fileId: string, rubricId: string): Promise<{
    instance: FileRubricInstanceDto | null;
    scores: FileRubricScoreDto[];
  }> {
    const instanceRow = await this.db.get<RubricInstanceRow>(
      `SELECT uuid, file_entity_uuid, rubric_entity_uuid, created_at, edited_at
       FROM file_rubric_instances
       WHERE file_entity_uuid = ? AND rubric_entity_uuid = ?
       ORDER BY COALESCE(edited_at, created_at) DESC, created_at DESC
       LIMIT 1;`,
      [fileId, rubricId]
    );
    if (!instanceRow) {
      return {
        instance: null,
        scores: []
      };
    }

    const scoreRows = await this.db.all<RubricInstanceScoreRow>(
      `SELECT uuid, rubric_instance_uuid, rubric_detail_uuid, assigned_score, created_at, edited_at
       FROM file_rubric_scores
       WHERE rubric_instance_uuid = ?
       ORDER BY created_at ASC, uuid ASC;`,
      [instanceRow.uuid]
    );

    return {
      instance: {
        uuid: instanceRow.uuid,
        fileEntityUuid: instanceRow.file_entity_uuid,
        rubricEntityUuid: instanceRow.rubric_entity_uuid,
        createdAt: instanceRow.created_at,
        editedAt: instanceRow.edited_at ?? undefined
      },
      scores: scoreRows.map((row) => ({
        uuid: row.uuid,
        rubricInstanceUuid: row.rubric_instance_uuid,
        rubricDetailUuid: row.rubric_detail_uuid,
        assignedScore: row.assigned_score,
        createdAt: row.created_at,
        editedAt: row.edited_at ?? undefined
      }))
    };
  }

  async saveFileRubricScores(
    fileId: string,
    rubricId: string,
    selections: Array<{ rubricDetailId: string; assignedScore: string }>
  ): Promise<{ instance: FileRubricInstanceDto; scores: FileRubricScoreDto[] }> {
    const nowIso = this.now();
    await this.db.exec('BEGIN;');
    try {
      await ensureFileRecord(this.db, fileId, nowIso);
      await ensureEntity(this.db, rubricId, 'rubric', nowIso);

      const rubricExists = await this.db.get<{ entity_uuid: string }>(
        'SELECT entity_uuid FROM rubrics WHERE entity_uuid = ? LIMIT 1;',
        [rubricId]
      );
      if (!rubricExists) {
        throw new Error(`Rubric does not exist: ${rubricId}`);
      }

      let instanceRow = await this.db.get<RubricInstanceRow>(
        `SELECT uuid, file_entity_uuid, rubric_entity_uuid, created_at, edited_at
         FROM file_rubric_instances
         WHERE file_entity_uuid = ? AND rubric_entity_uuid = ?
         ORDER BY COALESCE(edited_at, created_at) DESC, created_at DESC
         LIMIT 1;`,
        [fileId, rubricId]
      );

      if (!instanceRow) {
        const instanceId = randomUUID();
        await this.db.run(
          `INSERT INTO file_rubric_instances (uuid, file_entity_uuid, rubric_entity_uuid, created_at, edited_at)
           VALUES (?, ?, ?, ?, NULL);`,
          [instanceId, fileId, rubricId, nowIso]
        );
        instanceRow = {
          uuid: instanceId,
          file_entity_uuid: fileId,
          rubric_entity_uuid: rubricId,
          created_at: nowIso,
          edited_at: null
        };
      } else {
        await this.db.run(
          'UPDATE file_rubric_instances SET edited_at = ? WHERE uuid = ?;',
          [nowIso, instanceRow.uuid]
        );
        instanceRow = {
          ...instanceRow,
          edited_at: nowIso
        };
      }

      const seenDetailIds = new Set<string>();
      for (const selection of selections) {
        const detailId = selection.rubricDetailId.trim();
        if (!detailId || seenDetailIds.has(detailId)) {
          continue;
        }
        seenDetailIds.add(detailId);

        const detailBelongsToRubric = await this.db.get<{ uuid: string }>(
          'SELECT uuid FROM rubric_details WHERE uuid = ? AND entity_uuid = ? LIMIT 1;',
          [detailId, rubricId]
        );
        if (!detailBelongsToRubric) {
          throw new Error(`Rubric detail does not exist for this rubric: ${detailId}`);
        }

        const existingScore = await this.db.get<{ uuid: string }>(
          `SELECT uuid
           FROM file_rubric_scores
           WHERE rubric_instance_uuid = ? AND rubric_detail_uuid = ?
           LIMIT 1;`,
          [instanceRow.uuid, detailId]
        );
        if (existingScore) {
          await this.db.run(
            `UPDATE file_rubric_scores
             SET assigned_score = ?, edited_at = ?
             WHERE uuid = ?;`,
            [selection.assignedScore, nowIso, existingScore.uuid]
          );
        } else {
          await this.db.run(
            `INSERT INTO file_rubric_scores
             (uuid, rubric_instance_uuid, rubric_detail_uuid, assigned_score, created_at, edited_at)
             VALUES (?, ?, ?, ?, ?, NULL);`,
            [randomUUID(), instanceRow.uuid, detailId, selection.assignedScore, nowIso]
          );
        }
      }

      await this.db.exec('COMMIT;');

      const saved = await this.getFileRubricScores(fileId, rubricId);
      if (!saved.instance) {
        throw new Error('Saved rubric instance could not be loaded.');
      }
      return {
        instance: saved.instance,
        scores: saved.scores
      };
    } catch (error) {
      await this.db.exec('ROLLBACK;');
      throw error;
    }
  }
}
