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
              type: 'detailed'
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
            type: 'detailed'
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
});
