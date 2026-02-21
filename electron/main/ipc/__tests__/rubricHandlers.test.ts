import { describe, expect, it, vi } from 'vitest';
import { RUBRIC_CHANNELS, registerRubricHandlers } from '../rubricHandlers';
import type { RubricRepository } from '../../db/repositories/rubricRepository';

function createHarness() {
  const handle = vi.fn();

  return {
    handle,
    getHandler: (channel: string) => {
      const handler = handle.mock.calls.find(([registeredChannel]) => registeredChannel === channel)?.[1];
      expect(handler).toBeTypeOf('function');
      return handler as (event: unknown, payload?: unknown) => Promise<unknown>;
    }
  };
}

describe('registerRubricHandlers', () => {
  it('lists rubrics', async () => {
    const harness = createHarness();
    registerRubricHandlers(
      { handle: harness.handle },
      {
        repository: {
          listRubrics: vi.fn().mockResolvedValue([
            {
              entityUuid: 'rubric-1',
              name: 'Writing',
              type: 'detailed',
              isActive: true,
              isArchived: false
            }
          ]),
          getLastUsedRubricId: vi.fn().mockResolvedValue('rubric-1')
        } as unknown as RubricRepository
      }
    );

    const handler = harness.getHandler(RUBRIC_CHANNELS.listRubrics);
    const result = await handler({}, undefined);
    expect(result).toEqual({
      ok: true,
      data: {
        rubrics: [
          {
            entityUuid: 'rubric-1',
            name: 'Writing',
            type: 'detailed',
            isActive: true,
            isArchived: false
          }
        ],
        lastUsedRubricId: 'rubric-1'
      }
    });
  });

  it('validates getMatrix request payload', async () => {
    const harness = createHarness();
    registerRubricHandlers({ handle: harness.handle }, { repository: {} as RubricRepository });

    const handler = harness.getHandler(RUBRIC_CHANNELS.getMatrix);
    const result = await handler({}, { rubricId: '   ' });
    expect(result).toEqual({
      ok: false,
      error: {
        code: 'RUBRIC_GET_MATRIX_INVALID_PAYLOAD',
        message: 'Get rubric matrix request must include a non-empty rubricId.'
      }
    });
  });

  it('updates matrix with valid operation payload', async () => {
    const harness = createHarness();
    const updateRubricMatrix = vi.fn().mockResolvedValue(true);
    registerRubricHandlers(
      { handle: harness.handle },
      {
        repository: {
          updateRubricMatrix
        } as unknown as RubricRepository
      }
    );

    const handler = harness.getHandler(RUBRIC_CHANNELS.updateMatrix);
    const result = await handler({}, {
      rubricId: 'rubric-1',
      operation: {
        type: 'updateScoreValue',
        from: 4,
        to: 5
      }
    });

    expect(updateRubricMatrix).toHaveBeenCalledWith('rubric-1', {
      type: 'updateScoreValue',
      from: 4,
      to: 5
    });
    expect(result).toEqual({
      ok: true,
      data: {
        success: true
      }
    });
  });

  it('accepts delete category and delete score operations', async () => {
    const harness = createHarness();
    const updateRubricMatrix = vi.fn().mockResolvedValue(true);
    registerRubricHandlers(
      { handle: harness.handle },
      {
        repository: {
          updateRubricMatrix
        } as unknown as RubricRepository
      }
    );

    const handler = harness.getHandler(RUBRIC_CHANNELS.updateMatrix);

    const deleteCategoryResult = await handler({}, {
      rubricId: 'rubric-1',
      operation: {
        type: 'deleteCategory',
        category: 'Language'
      }
    });
    expect(deleteCategoryResult).toEqual({ ok: true, data: { success: true } });

    const deleteScoreResult = await handler({}, {
      rubricId: 'rubric-1',
      operation: {
        type: 'deleteScore',
        value: 3
      }
    });
    expect(deleteScoreResult).toEqual({ ok: true, data: { success: true } });
  });

  it('sets last used rubric id', async () => {
    const harness = createHarness();
    const setLastUsedRubricId = vi.fn().mockResolvedValue(true);
    registerRubricHandlers(
      { handle: harness.handle },
      {
        repository: {
          setLastUsedRubricId
        } as unknown as RubricRepository
      }
    );

    const handler = harness.getHandler(RUBRIC_CHANNELS.setLastUsed);
    const result = await handler({}, { rubricId: 'rubric-1' });
    expect(setLastUsedRubricId).toHaveBeenCalledWith('rubric-1', 'default');
    expect(result).toEqual({
      ok: true,
      data: {
        rubricId: 'rubric-1'
      }
    });
  });

  it('creates a rubric and returns rubric id', async () => {
    const harness = createHarness();
    const createRubric = vi.fn().mockResolvedValue('rubric-created');
    registerRubricHandlers(
      { handle: harness.handle },
      {
        repository: {
          createRubric
        } as unknown as RubricRepository
      }
    );

    const handler = harness.getHandler(RUBRIC_CHANNELS.createRubric);
    const result = await handler({}, { name: 'New Rubric' });
    expect(createRubric).toHaveBeenCalledWith('New Rubric', 'default');
    expect(result).toEqual({
      ok: true,
      data: {
        rubricId: 'rubric-created'
      }
    });
  });

  it('clones a rubric and returns rubric id', async () => {
    const harness = createHarness();
    const cloneRubric = vi.fn().mockResolvedValue('rubric-cloned');
    registerRubricHandlers(
      { handle: harness.handle },
      {
        repository: {
          cloneRubric
        } as unknown as RubricRepository
      }
    );

    const handler = harness.getHandler(RUBRIC_CHANNELS.cloneRubric);
    const result = await handler({}, { rubricId: 'rubric-1' });
    expect(cloneRubric).toHaveBeenCalledWith('rubric-1', 'default');
    expect(result).toEqual({
      ok: true,
      data: {
        rubricId: 'rubric-cloned'
      }
    });
  });

  it('maps delete in-use status to RUBRIC_IN_USE', async () => {
    const harness = createHarness();
    const deleteRubric = vi.fn().mockResolvedValue('in_use');
    registerRubricHandlers(
      { handle: harness.handle },
      {
        repository: {
          deleteRubric
        } as unknown as RubricRepository
      }
    );

    const handler = harness.getHandler(RUBRIC_CHANNELS.deleteRubric);
    const result = await handler({}, { rubricId: 'rubric-1' });
    expect(result).toEqual({
      ok: false,
      error: {
        code: 'RUBRIC_IN_USE',
        message: 'This rubric has been used for scoring and cannot be deleted.'
      }
    });
  });

  it('returns grading context for a file', async () => {
    const harness = createHarness();
    const getRubricGradingContext = vi.fn().mockResolvedValue({
      fileId: 'file-1',
      lockedRubricId: 'rubric-1',
      selectedRubricIdForFile: 'rubric-1'
    });
    registerRubricHandlers(
      { handle: harness.handle },
      {
        repository: {
          getRubricGradingContext
        } as unknown as RubricRepository
      }
    );

    const handler = harness.getHandler(RUBRIC_CHANNELS.getGradingContext);
    const result = await handler({}, { fileId: 'file-1' });
    expect(getRubricGradingContext).toHaveBeenCalledWith('file-1');
    expect(result).toEqual({
      ok: true,
      data: {
        fileId: 'file-1',
        lockedRubricId: 'rubric-1',
        selectedRubricIdForFile: 'rubric-1'
      }
    });
  });

  it('gets file rubric scores', async () => {
    const harness = createHarness();
    const getFileRubricScores = vi.fn().mockResolvedValue({
      instance: null,
      scores: []
    });
    registerRubricHandlers(
      { handle: harness.handle },
      {
        repository: {
          getFileRubricScores
        } as unknown as RubricRepository
      }
    );

    const handler = harness.getHandler(RUBRIC_CHANNELS.getFileScores);
    const result = await handler({}, { fileId: 'file-1', rubricId: 'rubric-1' });
    expect(getFileRubricScores).toHaveBeenCalledWith('file-1', 'rubric-1');
    expect(result).toEqual({
      ok: true,
      data: {
        instance: null,
        scores: []
      }
    });
  });

  it('saves file rubric scores', async () => {
    const harness = createHarness();
    const saveFileRubricScores = vi.fn().mockResolvedValue({
      instance: {
        uuid: 'inst-1',
        fileEntityUuid: 'file-1',
        rubricEntityUuid: 'rubric-1',
        createdAt: '2026-02-21T00:00:00.000Z'
      },
      scores: []
    });
    registerRubricHandlers(
      { handle: harness.handle },
      {
        repository: {
          saveFileRubricScores
        } as unknown as RubricRepository
      }
    );

    const handler = harness.getHandler(RUBRIC_CHANNELS.saveFileScores);
    const result = await handler({}, {
      fileId: 'file-1',
      rubricId: 'rubric-1',
      selections: [{ rubricDetailId: 'detail-1', assignedScore: '4' }]
    });
    expect(saveFileRubricScores).toHaveBeenCalledWith('file-1', 'rubric-1', [
      { rubricDetailId: 'detail-1', assignedScore: '4' }
    ]);
    expect(result).toEqual({
      ok: true,
      data: {
        instance: {
          uuid: 'inst-1',
          fileEntityUuid: 'file-1',
          rubricEntityUuid: 'rubric-1',
          createdAt: '2026-02-21T00:00:00.000Z'
        },
        scores: []
      }
    });
  });

  it('clears applied rubric by filepath', async () => {
    const harness = createHarness();
    const clearAppliedRubricForFilepath = vi.fn().mockResolvedValue({
      fileId: 'file-1',
      filepathId: 'folder-1',
      clearedRubricId: 'rubric-1'
    });
    registerRubricHandlers(
      { handle: harness.handle },
      {
        repository: {
          clearAppliedRubricForFilepath
        } as unknown as RubricRepository
      }
    );

    const handler = harness.getHandler(RUBRIC_CHANNELS.clearAppliedRubric);
    const result = await handler({}, { fileId: 'file-1', rubricId: 'rubric-1' });
    expect(clearAppliedRubricForFilepath).toHaveBeenCalledWith('file-1', 'rubric-1');
    expect(result).toEqual({
      ok: true,
      data: {
        fileId: 'file-1',
        filepathId: 'folder-1',
        clearedRubricId: 'rubric-1'
      }
    });
  });
});
