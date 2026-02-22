import { describe, expect, it } from 'vitest';
import { SQLiteClient } from '../../sqlite';
import { RubricRepository } from '../rubricRepository';

async function seedRubric(db: SQLiteClient): Promise<string> {
  const rubricId = 'rubric-1';
  await db.run("INSERT INTO entities (uuid, type, created_at) VALUES (?, 'rubric', ?);", [
    rubricId,
    '2026-02-20T00:00:00.000Z'
  ]);
  await db.run(
    "INSERT INTO rubrics (entity_uuid, name, type, is_active, is_archived) VALUES (?, ?, 'detailed', 0, 0);",
    [rubricId, 'Writing Rubric']
  );

  const details = [
    { id: 'd-1', category: 'Content', description: 'Content 4', score: 4 },
    { id: 'd-2', category: 'Content', description: 'Content 3', score: 3 },
    { id: 'd-3', category: 'Grammar', description: 'Grammar 4', score: 4 },
    { id: 'd-4', category: 'Grammar', description: 'Grammar 3', score: 3 }
  ];

  for (const detail of details) {
    await db.run(
      'INSERT INTO rubric_details (uuid, entity_uuid, category, description) VALUES (?, ?, ?, ?);',
      [detail.id, rubricId, detail.category, detail.description]
    );
    await db.run('INSERT INTO rubric_scores (uuid, details_uuid, score_values) VALUES (?, ?, ?);', [
      `s-${detail.id}`,
      detail.id,
      detail.score
    ]);
  }

  return rubricId;
}

describe('RubricRepository', () => {
  it('lists rubrics and returns matrix with details + scores', async () => {
    const db = new SQLiteClient({ dbPath: ':memory:' });
    const rubricId = await seedRubric(db);
    const repository = new RubricRepository({ db });

    const rubrics = await repository.listRubrics();
    expect(rubrics.some((rubric) => rubric.entityUuid === rubricId)).toBe(true);
    expect(rubrics.some((rubric) => rubric.entityUuid === '11111111-1111-4111-8111-111111111111')).toBe(true);

    const matrix = await repository.getRubricMatrix(rubricId);
    expect(matrix?.rubric.entityUuid).toBe(rubricId);
    expect(matrix?.details).toHaveLength(4);
    expect(matrix?.scores).toHaveLength(4);
  });

  it('updates rubric operations against sqlite rows', async () => {
    const db = new SQLiteClient({ dbPath: ':memory:' });
    const rubricId = await seedRubric(db);
    const repository = new RubricRepository({ db });

    expect(await repository.updateRubricMatrix(rubricId, { type: 'setRubricName', name: 'Updated Rubric' })).toBe('updated');
    expect(
      await repository.updateRubricMatrix(rubricId, {
        type: 'updateCellDescription',
        detailId: 'd-1',
        description: 'Updated cell'
      })
    ).toBe('updated');
    expect(
      await repository.updateRubricMatrix(rubricId, {
        type: 'updateCategoryName',
        from: 'Grammar',
        to: 'Language Use'
      })
    ).toBe('updated');
    expect(
      await repository.updateRubricMatrix(rubricId, {
        type: 'updateScoreValue',
        from: 3,
        to: 2
      })
    ).toBe('updated');

    const matrix = await repository.getRubricMatrix(rubricId);
    expect(matrix?.rubric.name).toBe('Updated Rubric');
    expect(matrix?.details.find((detail) => detail.uuid === 'd-1')?.description).toBe('Updated cell');
    expect(matrix?.details.some((detail) => detail.category === 'Language Use')).toBe(true);
    expect(matrix?.scores.some((score) => score.scoreValues === 2)).toBe(true);
  });

  it('does not include archived rubrics in list', async () => {
    const db = new SQLiteClient({ dbPath: ':memory:' });
    const rubricId = await seedRubric(db);
    await db.run('UPDATE rubrics SET is_archived = 1 WHERE entity_uuid = ?;', [rubricId]);
    const repository = new RubricRepository({ db });

    const rubrics = await repository.listRubrics();
    expect(rubrics.some((rubric) => rubric.entityUuid === rubricId)).toBe(false);
  });

  it('blocks rubric edits when rubric is active', async () => {
    const db = new SQLiteClient({ dbPath: ':memory:' });
    const rubricId = await seedRubric(db);
    await db.run('UPDATE rubrics SET is_active = 1 WHERE entity_uuid = ?;', [rubricId]);
    const repository = new RubricRepository({ db });

    const status = await repository.updateRubricMatrix(rubricId, {
      type: 'updateCellDescription',
      detailId: 'd-1',
      description: 'Should not apply'
    });
    expect(status).toBe('inactive');
  });

  it('clones a rubric with new identifiers', async () => {
    const db = new SQLiteClient({ dbPath: ':memory:' });
    const rubricId = await seedRubric(db);
    const repository = new RubricRepository({ db });

    const clonedRubricId = await repository.cloneRubric(rubricId, 'default');
    expect(clonedRubricId).toBeTruthy();
    expect(clonedRubricId).not.toBe(rubricId);

    const source = await repository.getRubricMatrix(rubricId);
    const cloned = await repository.getRubricMatrix(clonedRubricId as string);
    expect(cloned?.rubric.name).toBe('Writing Rubric cloned');
    expect(cloned?.rubric.isActive).toBe(false);
    expect(cloned?.details).toHaveLength(source?.details.length ?? 0);
    expect(cloned?.scores).toHaveLength(source?.scores.length ?? 0);
    expect(cloned?.details.some((detail) => detail.entityUuid === rubricId)).toBe(false);
  });

  it('returns active when deleting rubric with saved scores', async () => {
    const db = new SQLiteClient({ dbPath: ':memory:' });
    const rubricId = await seedRubric(db);
    const repository = new RubricRepository({ db, now: () => '2026-02-20T12:00:00.000Z' });

    await repository.saveFileRubricScores('file-1', rubricId, [{ rubricDetailId: 'd-1', assignedScore: '4' }]);
    const status = await repository.deleteRubric(rubricId);
    expect(status).toBe('active');
  });

  it('returns grading context with locked rubric once scores exist', async () => {
    const db = new SQLiteClient({ dbPath: ':memory:' });
    const rubricId = await seedRubric(db);
    const repository = new RubricRepository({ db, now: () => '2026-02-20T12:00:00.000Z' });

    const before = await repository.getRubricGradingContext('file-1');
    expect(before.lockedRubricId).toBeUndefined();
    expect(before.selectedRubricIdForFile).toBeUndefined();

    await repository.saveFileRubricScores('file-1', rubricId, [{ rubricDetailId: 'd-1', assignedScore: '4' }]);
    const after = await repository.getRubricGradingContext('file-1');
    expect(after.lockedRubricId).toBe(rubricId);
    expect(after.selectedRubricIdForFile).toBe(rubricId);
  });

  it('clears applied rubric and all rubric scores for a filepath', async () => {
    const db = new SQLiteClient({ dbPath: ':memory:' });
    const rubricId = await seedRubric(db);
    const repository = new RubricRepository({ db, now: () => '2026-02-20T12:00:00.000Z' });

    await repository.saveFileRubricScores('/tmp/classroom/file-1.docx', rubricId, [
      { rubricDetailId: 'd-1', assignedScore: '4' }
    ]);
    await repository.saveFileRubricScores('/tmp/classroom/file-2.docx', rubricId, [
      { rubricDetailId: 'd-3', assignedScore: '4' }
    ]);

    const cleared = await repository.clearAppliedRubricForFilepath('/tmp/classroom/file-1.docx', rubricId);
    expect(cleared?.clearedRubricId).toBe(rubricId);

    const first = await repository.getFileRubricScores('/tmp/classroom/file-1.docx', rubricId);
    const second = await repository.getFileRubricScores('/tmp/classroom/file-2.docx', rubricId);
    expect(first.instance).toBeNull();
    expect(first.scores).toHaveLength(0);
    expect(second.instance).toBeNull();
    expect(second.scores).toHaveLength(0);

    const context = await repository.getRubricGradingContext('/tmp/classroom/file-1.docx');
    expect(context.lockedRubricId).toBeUndefined();
  });

  it('does not clear filepath rubric data when rubric id does not match', async () => {
    const db = new SQLiteClient({ dbPath: ':memory:' });
    const rubricId = await seedRubric(db);
    const repository = new RubricRepository({ db, now: () => '2026-02-20T12:00:00.000Z' });

    await repository.saveFileRubricScores('/tmp/classroom/file-1.docx', rubricId, [
      { rubricDetailId: 'd-1', assignedScore: '4' }
    ]);

    const cleared = await repository.clearAppliedRubricForFilepath('/tmp/classroom/file-1.docx', 'rubric-not-matching');
    expect(cleared).toBeNull();

    const first = await repository.getFileRubricScores('/tmp/classroom/file-1.docx', rubricId);
    expect(first.instance).not.toBeNull();
    expect(first.scores).toHaveLength(1);
  });

  it('creates a category and a score by expanding existing axis values', async () => {
    const db = new SQLiteClient({ dbPath: ':memory:' });
    const rubricId = await seedRubric(db);
    const repository = new RubricRepository({ db });

    await repository.updateRubricMatrix(rubricId, { type: 'createCategory', name: 'Organization' });
    await repository.updateRubricMatrix(rubricId, { type: 'createScore', value: 1 });

    const matrix = await repository.getRubricMatrix(rubricId);
    const organizationRows = matrix?.details.filter((detail) => detail.category === 'Organization') ?? [];
    expect(organizationRows.length).toBeGreaterThan(0);
    expect(matrix?.scores.some((score) => score.scoreValues === 1)).toBe(true);
  });

  it('deletes a category and removes all related rows', async () => {
    const db = new SQLiteClient({ dbPath: ':memory:' });
    const rubricId = await seedRubric(db);
    const repository = new RubricRepository({ db });

    await repository.updateRubricMatrix(rubricId, { type: 'deleteCategory', category: 'Grammar' });
    const matrix = await repository.getRubricMatrix(rubricId);
    expect(matrix?.details.some((detail) => detail.category === 'Grammar')).toBe(false);
    expect(matrix?.details).toHaveLength(2);
    expect(matrix?.scores).toHaveLength(2);
  });

  it('deletes a score band and removes orphaned details', async () => {
    const db = new SQLiteClient({ dbPath: ':memory:' });
    const rubricId = await seedRubric(db);
    const repository = new RubricRepository({ db });

    await repository.updateRubricMatrix(rubricId, { type: 'deleteScore', value: 3 });
    const matrix = await repository.getRubricMatrix(rubricId);
    expect(matrix?.scores.some((score) => score.scoreValues === 3)).toBe(false);
    expect(matrix?.details).toHaveLength(2);
    expect(matrix?.scores).toHaveLength(2);
  });

  it('gets and sets last used rubric id', async () => {
    const db = new SQLiteClient({ dbPath: ':memory:' });
    const rubricId = await seedRubric(db);
    const repository = new RubricRepository({ db, now: () => '2026-02-20T12:00:00.000Z' });

    const seededLastUsed = await repository.getLastUsedRubricId('default');
    expect(seededLastUsed).toBe('11111111-1111-4111-8111-111111111111');

    const updated = await repository.setLastUsedRubricId(rubricId, 'default');
    expect(updated).toBe(true);
    const nextLastUsed = await repository.getLastUsedRubricId('default');
    expect(nextLastUsed).toBe(rubricId);
  });

  it('creates a new rubric template and marks it last used', async () => {
    const db = new SQLiteClient({ dbPath: ':memory:' });
    const repository = new RubricRepository({ db, now: () => '2026-02-20T12:30:00.000Z' });

    const createdRubricId = await repository.createRubric('New Rubric', 'default');
    const matrix = await repository.getRubricMatrix(createdRubricId);
    expect(matrix?.rubric.name).toBe('New Rubric');
    expect(matrix?.rubric.isActive).toBe(false);

    const categories = new Set(matrix?.details.map((detail) => detail.category) ?? []);
    expect(categories).toEqual(new Set(['Category 1', 'Category 2', 'Category 3']));

    const scores = new Set(matrix?.scores.map((score) => score.scoreValues) ?? []);
    expect(scores).toEqual(new Set([5, 4, 3, 2, 1]));

    const matchingDescription = matrix?.details.find(
      (detail) => detail.category === 'Category 1' && detail.description === 'Category 1 at 5 points'
    );
    expect(matchingDescription).toBeDefined();

    const lastUsedRubricId = await repository.getLastUsedRubricId('default');
    expect(lastUsedRubricId).toBe(createdRubricId);
  });
});
