import { appErr, appOk } from '../../shared/appResult';
import type {
  ClearAppliedRubricRequest,
  ClearAppliedRubricResponse,
  CloneRubricRequest,
  CloneRubricResponse,
  CreateRubricRequest,
  CreateRubricResponse,
  DeleteRubricRequest,
  DeleteRubricResponse,
  GetFileRubricScoresRequest,
  GetFileRubricScoresResponse,
  GetRubricGradingContextRequest,
  GetRubricGradingContextResponse,
  GetRubricMatrixRequest,
  GetRubricMatrixResponse,
  ListRubricsResponse,
  SaveFileRubricScoresRequest,
  SaveFileRubricScoresResponse,
  SetLastUsedRubricRequest,
  SetLastUsedRubricResponse,
  UpdateRubricMatrixRequest,
  UpdateRubricOperation,
  UpdateRubricMatrixResponse
} from '../../shared/rubricContracts';
import { RubricRepository } from '../db/repositories/rubricRepository';
import type { IpcMainLike } from './types';

export const RUBRIC_CHANNELS = {
  listRubrics: 'rubric/listRubrics',
  createRubric: 'rubric/createRubric',
  cloneRubric: 'rubric/cloneRubric',
  deleteRubric: 'rubric/deleteRubric',
  getFileScores: 'rubric/getFileScores',
  saveFileScores: 'rubric/saveFileScores',
  clearAppliedRubric: 'rubric/clearAppliedRubric',
  getGradingContext: 'rubric/getGradingContext',
  getMatrix: 'rubric/getMatrix',
  updateMatrix: 'rubric/updateMatrix',
  setLastUsed: 'rubric/setLastUsed'
} as const;

interface RubricHandlerDeps {
  repository: RubricRepository;
}

function getDefaultDeps(): RubricHandlerDeps {
  return {
    repository: new RubricRepository()
  };
}

function normalizeNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function hasOwnProperty(candidate: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(candidate, key);
}

function normalizeGetRubricMatrixRequest(request: unknown): GetRubricMatrixRequest | null {
  if (typeof request !== 'object' || request === null) {
    return null;
  }
  const candidate = request as Record<string, unknown>;
  const rubricId = normalizeNonEmptyString(candidate.rubricId);
  if (!rubricId) {
    return null;
  }
  return { rubricId };
}

function normalizeCreateRubricRequest(request: unknown): CreateRubricRequest | null {
  if (request === undefined) {
    return {};
  }
  if (typeof request !== 'object' || request === null) {
    return null;
  }
  const candidate = request as Record<string, unknown>;
  if (!hasOwnProperty(candidate, 'name')) {
    return {};
  }
  if (candidate.name === undefined) {
    return {};
  }
  if (typeof candidate.name !== 'string') {
    return null;
  }
  return { name: candidate.name };
}

function normalizeUpdateOperation(value: unknown): UpdateRubricOperation | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (candidate.type === 'setRubricName') {
    const name = normalizeNonEmptyString(candidate.name);
    if (!name) {
      return null;
    }
    return { type: 'setRubricName', name };
  }

  if (candidate.type === 'updateCellDescription') {
    const detailId = normalizeNonEmptyString(candidate.detailId);
    if (!detailId || typeof candidate.description !== 'string') {
      return null;
    }
    return { type: 'updateCellDescription', detailId, description: candidate.description };
  }

  if (candidate.type === 'updateCategoryName') {
    const from = normalizeNonEmptyString(candidate.from);
    const to = normalizeNonEmptyString(candidate.to);
    if (!from || !to) {
      return null;
    }
    return { type: 'updateCategoryName', from, to };
  }

  if (candidate.type === 'updateScoreValue') {
    if (typeof candidate.from !== 'number' || typeof candidate.to !== 'number') {
      return null;
    }
    if (!Number.isFinite(candidate.from) || !Number.isFinite(candidate.to)) {
      return null;
    }
    return {
      type: 'updateScoreValue',
      from: candidate.from,
      to: candidate.to
    };
  }

  if (candidate.type === 'createCategory') {
    const name = normalizeNonEmptyString(candidate.name);
    if (!name) {
      return null;
    }
    return { type: 'createCategory', name };
  }

  if (candidate.type === 'createScore') {
    if (typeof candidate.value !== 'number' || !Number.isFinite(candidate.value)) {
      return null;
    }
    return { type: 'createScore', value: candidate.value };
  }

  if (candidate.type === 'deleteCategory') {
    const category = normalizeNonEmptyString(candidate.category);
    if (!category) {
      return null;
    }
    return { type: 'deleteCategory', category };
  }

  if (candidate.type === 'deleteScore') {
    if (typeof candidate.value !== 'number' || !Number.isFinite(candidate.value)) {
      return null;
    }
    return { type: 'deleteScore', value: candidate.value };
  }

  return null;
}

function normalizeUpdateRubricMatrixRequest(request: unknown): UpdateRubricMatrixRequest | null {
  if (typeof request !== 'object' || request === null) {
    return null;
  }
  const candidate = request as Record<string, unknown>;
  const rubricId = normalizeNonEmptyString(candidate.rubricId);
  if (!rubricId || !hasOwnProperty(candidate, 'operation')) {
    return null;
  }
  const operation = normalizeUpdateOperation(candidate.operation);
  if (!operation) {
    return null;
  }
  return {
    rubricId,
    operation
  };
}

function normalizeSetLastUsedRubricRequest(request: unknown): SetLastUsedRubricRequest | null {
  if (typeof request !== 'object' || request === null) {
    return null;
  }
  const candidate = request as Record<string, unknown>;
  const rubricId = normalizeNonEmptyString(candidate.rubricId);
  if (!rubricId) {
    return null;
  }
  return { rubricId };
}

function normalizeCloneRubricRequest(request: unknown): CloneRubricRequest | null {
  if (typeof request !== 'object' || request === null) {
    return null;
  }
  const candidate = request as Record<string, unknown>;
  const rubricId = normalizeNonEmptyString(candidate.rubricId);
  if (!rubricId) {
    return null;
  }
  return { rubricId };
}

function normalizeDeleteRubricRequest(request: unknown): DeleteRubricRequest | null {
  if (typeof request !== 'object' || request === null) {
    return null;
  }
  const candidate = request as Record<string, unknown>;
  const rubricId = normalizeNonEmptyString(candidate.rubricId);
  if (!rubricId) {
    return null;
  }
  return { rubricId };
}

function normalizeGetRubricGradingContextRequest(request: unknown): GetRubricGradingContextRequest | null {
  if (typeof request !== 'object' || request === null) {
    return null;
  }
  const candidate = request as Record<string, unknown>;
  const fileId = normalizeNonEmptyString(candidate.fileId);
  if (!fileId) {
    return null;
  }
  return { fileId };
}

function normalizeGetFileRubricScoresRequest(request: unknown): GetFileRubricScoresRequest | null {
  if (typeof request !== 'object' || request === null) {
    return null;
  }
  const candidate = request as Record<string, unknown>;
  const fileId = normalizeNonEmptyString(candidate.fileId);
  const rubricId = normalizeNonEmptyString(candidate.rubricId);
  if (!fileId || !rubricId) {
    return null;
  }
  return { fileId, rubricId };
}

function normalizeSaveFileRubricScoresRequest(request: unknown): SaveFileRubricScoresRequest | null {
  if (typeof request !== 'object' || request === null) {
    return null;
  }
  const candidate = request as Record<string, unknown>;
  const fileId = normalizeNonEmptyString(candidate.fileId);
  const rubricId = normalizeNonEmptyString(candidate.rubricId);
  if (!fileId || !rubricId || !Array.isArray(candidate.selections)) {
    return null;
  }

  const selections: SaveFileRubricScoresRequest['selections'] = [];
  for (const selection of candidate.selections) {
    if (typeof selection !== 'object' || selection === null) {
      return null;
    }
    const selectionCandidate = selection as Record<string, unknown>;
    const rubricDetailId = normalizeNonEmptyString(selectionCandidate.rubricDetailId);
    const assignedScore = normalizeNonEmptyString(selectionCandidate.assignedScore);
    if (!rubricDetailId || !assignedScore) {
      return null;
    }
    selections.push({ rubricDetailId, assignedScore });
  }

  return { fileId, rubricId, selections };
}

function normalizeClearAppliedRubricRequest(request: unknown): ClearAppliedRubricRequest | null {
  if (typeof request !== 'object' || request === null) {
    return null;
  }
  const candidate = request as Record<string, unknown>;
  const fileId = normalizeNonEmptyString(candidate.fileId);
  const rubricId = normalizeNonEmptyString(candidate.rubricId);
  if (!fileId || !rubricId) {
    return null;
  }
  return { fileId, rubricId };
}

export function registerRubricHandlers(ipcMain: IpcMainLike, deps: RubricHandlerDeps = getDefaultDeps()): void {
  ipcMain.handle(RUBRIC_CHANNELS.listRubrics, async () => {
    try {
      const rubrics = await deps.repository.listRubrics();
      const lastUsedRubricId = await deps.repository.getLastUsedRubricId('default');
      return appOk<ListRubricsResponse>({ rubrics, lastUsedRubricId: lastUsedRubricId ?? undefined });
    } catch (error) {
      return appErr({
        code: 'RUBRIC_LIST_FAILED',
        message: 'Could not load rubrics.',
        details: error
      });
    }
  });

  ipcMain.handle(RUBRIC_CHANNELS.createRubric, async (_event, requestPayload) => {
    const request = normalizeCreateRubricRequest(requestPayload);
    if (!request) {
      return appErr({
        code: 'RUBRIC_CREATE_INVALID_PAYLOAD',
        message: 'Create rubric payload is invalid.'
      });
    }

    try {
      const rubricId = await deps.repository.createRubric(request.name ?? 'New Rubric', 'default');
      return appOk<CreateRubricResponse>({ rubricId });
    } catch (error) {
      return appErr({
        code: 'RUBRIC_CREATE_FAILED',
        message: 'Could not create rubric.',
        details: error
      });
    }
  });

  ipcMain.handle(RUBRIC_CHANNELS.cloneRubric, async (_event, requestPayload) => {
    const request = normalizeCloneRubricRequest(requestPayload);
    if (!request) {
      return appErr({
        code: 'RUBRIC_CLONE_INVALID_PAYLOAD',
        message: 'Clone rubric payload is invalid.'
      });
    }

    try {
      const rubricId = await deps.repository.cloneRubric(request.rubricId, 'default');
      if (!rubricId) {
        return appErr({
          code: 'RUBRIC_NOT_FOUND',
          message: `Rubric not found for id ${request.rubricId}.`
        });
      }
      return appOk<CloneRubricResponse>({ rubricId });
    } catch (error) {
      return appErr({
        code: 'RUBRIC_CLONE_FAILED',
        message: 'Could not clone rubric.',
        details: error
      });
    }
  });

  ipcMain.handle(RUBRIC_CHANNELS.deleteRubric, async (_event, requestPayload) => {
    const request = normalizeDeleteRubricRequest(requestPayload);
    if (!request) {
      return appErr({
        code: 'RUBRIC_DELETE_INVALID_PAYLOAD',
        message: 'Delete rubric payload is invalid.'
      });
    }

    try {
      const result = await deps.repository.deleteRubric(request.rubricId);
      if (result === 'not_found') {
        return appErr({
          code: 'RUBRIC_NOT_FOUND',
          message: `Rubric not found for id ${request.rubricId}.`
        });
      }
      if (result === 'active') {
        return appErr({
          code: 'RUBRIC_ACTIVE',
          message: 'Active rubrics cannot be deleted.'
        });
      }
      if (result === 'in_use') {
        return appErr({
          code: 'RUBRIC_IN_USE',
          message: 'This rubric has been used for scoring and cannot be deleted.'
        });
      }
      return appOk<DeleteRubricResponse>({ rubricId: request.rubricId });
    } catch (error) {
      return appErr({
        code: 'RUBRIC_DELETE_FAILED',
        message: 'Could not delete rubric.',
        details: error
      });
    }
  });

  ipcMain.handle(RUBRIC_CHANNELS.getGradingContext, async (_event, requestPayload) => {
    const request = normalizeGetRubricGradingContextRequest(requestPayload);
    if (!request) {
      return appErr({
        code: 'RUBRIC_GET_GRADING_CONTEXT_INVALID_PAYLOAD',
        message: 'Get rubric grading context request must include a non-empty fileId.'
      });
    }

    try {
      const context = await deps.repository.getRubricGradingContext(request.fileId);
      return appOk<GetRubricGradingContextResponse>(context);
    } catch (error) {
      return appErr({
        code: 'RUBRIC_GET_GRADING_CONTEXT_FAILED',
        message: 'Could not load rubric grading context.',
        details: error
      });
    }
  });

  ipcMain.handle(RUBRIC_CHANNELS.getFileScores, async (_event, requestPayload) => {
    const request = normalizeGetFileRubricScoresRequest(requestPayload);
    if (!request) {
      return appErr({
        code: 'RUBRIC_GET_FILE_SCORES_INVALID_PAYLOAD',
        message: 'Get file rubric scores request must include non-empty fileId and rubricId.'
      });
    }

    try {
      const response = await deps.repository.getFileRubricScores(request.fileId, request.rubricId);
      return appOk<GetFileRubricScoresResponse>(response);
    } catch (error) {
      return appErr({
        code: 'RUBRIC_GET_FILE_SCORES_FAILED',
        message: 'Could not load saved file rubric scores.',
        details: error
      });
    }
  });

  ipcMain.handle(RUBRIC_CHANNELS.saveFileScores, async (_event, requestPayload) => {
    const request = normalizeSaveFileRubricScoresRequest(requestPayload);
    if (!request) {
      return appErr({
        code: 'RUBRIC_SAVE_FILE_SCORES_INVALID_PAYLOAD',
        message: 'Save file rubric scores request is invalid.'
      });
    }

    try {
      const response = await deps.repository.saveFileRubricScores(request.fileId, request.rubricId, request.selections);
      return appOk<SaveFileRubricScoresResponse>(response);
    } catch (error) {
      return appErr({
        code: 'RUBRIC_SAVE_FILE_SCORES_FAILED',
        message: error instanceof Error ? error.message : 'Could not save file rubric scores.',
        details: error
      });
    }
  });

  ipcMain.handle(RUBRIC_CHANNELS.clearAppliedRubric, async (_event, requestPayload) => {
    const request = normalizeClearAppliedRubricRequest(requestPayload);
    if (!request) {
      return appErr({
        code: 'RUBRIC_CLEAR_APPLIED_INVALID_PAYLOAD',
        message: 'Clear applied rubric request must include non-empty fileId and rubricId.'
      });
    }

    try {
      const cleared = await deps.repository.clearAppliedRubricForFilepath(request.fileId, request.rubricId);
      if (!cleared) {
        return appErr({
          code: 'RUBRIC_CLEAR_APPLIED_NOT_FOUND',
          message: 'No applied rubric was found for this file path and rubric.'
        });
      }
      return appOk<ClearAppliedRubricResponse>(cleared);
    } catch (error) {
      return appErr({
        code: 'RUBRIC_CLEAR_APPLIED_FAILED',
        message: 'Could not clear applied rubric and scores.',
        details: error
      });
    }
  });

  ipcMain.handle(RUBRIC_CHANNELS.getMatrix, async (_event, requestPayload) => {
    const request = normalizeGetRubricMatrixRequest(requestPayload);
    if (!request) {
      return appErr({
        code: 'RUBRIC_GET_MATRIX_INVALID_PAYLOAD',
        message: 'Get rubric matrix request must include a non-empty rubricId.'
      });
    }

    try {
      const matrix = await deps.repository.getRubricMatrix(request.rubricId);
      if (!matrix) {
        return appErr({
          code: 'RUBRIC_NOT_FOUND',
          message: `Rubric not found for id ${request.rubricId}.`
        });
      }
      return appOk<GetRubricMatrixResponse>(matrix);
    } catch (error) {
      return appErr({
        code: 'RUBRIC_GET_MATRIX_FAILED',
        message: 'Could not load rubric matrix.',
        details: error
      });
    }
  });

  ipcMain.handle(RUBRIC_CHANNELS.updateMatrix, async (_event, requestPayload) => {
    const request = normalizeUpdateRubricMatrixRequest(requestPayload);
    if (!request) {
      return appErr({
        code: 'RUBRIC_UPDATE_MATRIX_INVALID_PAYLOAD',
        message: 'Update rubric matrix payload is invalid.'
      });
    }

    try {
      const updated = await deps.repository.updateRubricMatrix(request.rubricId, request.operation);
      if (updated === 'not_found') {
        return appErr({
          code: 'RUBRIC_NOT_FOUND',
          message: `Rubric not found for id ${request.rubricId}.`
        });
      }
      if (updated === 'archived') {
        return appErr({
          code: 'RUBRIC_ARCHIVED',
          message: 'Archived rubrics cannot be edited.'
        });
      }
      if (updated === 'inactive') {
        return appErr({
          code: 'RUBRIC_INACTIVE',
          message: 'This rubric is locked because it has been used and cannot be edited.'
        });
      }
      return appOk<UpdateRubricMatrixResponse>({ success: true });
    } catch (error) {
      return appErr({
        code: 'RUBRIC_UPDATE_MATRIX_FAILED',
        message: 'Could not update rubric matrix.',
        details: error
      });
    }
  });

  ipcMain.handle(RUBRIC_CHANNELS.setLastUsed, async (_event, requestPayload) => {
    const request = normalizeSetLastUsedRubricRequest(requestPayload);
    if (!request) {
      return appErr({
        code: 'RUBRIC_SET_LAST_USED_INVALID_PAYLOAD',
        message: 'Set last used rubric request must include a non-empty rubricId.'
      });
    }

    try {
      const updated = await deps.repository.setLastUsedRubricId(request.rubricId, 'default');
      if (!updated) {
        return appErr({
          code: 'RUBRIC_NOT_FOUND',
          message: `Rubric not found for id ${request.rubricId}.`
        });
      }
      return appOk<SetLastUsedRubricResponse>({ rubricId: request.rubricId });
    } catch (error) {
      return appErr({
        code: 'RUBRIC_SET_LAST_USED_FAILED',
        message: 'Could not set last used rubric.',
        details: error
      });
    }
  });
}
