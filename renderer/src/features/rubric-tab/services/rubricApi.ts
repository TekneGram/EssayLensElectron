import type { AppError, AppResult } from '../../../../../electron/shared/appResult';
import type {
  GetRubricMatrixRequest,
  GetRubricMatrixResponse,
  ListRubricsResponse,
  RubricDetailDto,
  RubricDto,
  RubricScoreDto,
  UpdateRubricMatrixRequest,
  UpdateRubricMatrixResponse
} from '../../../../../electron/shared/rubricContracts';
import type { RubricSourceData } from './types';

type RubricApi = {
  listRubrics: () => Promise<AppResult<ListRubricsResponse>>;
  getMatrix: (request: GetRubricMatrixRequest) => Promise<AppResult<GetRubricMatrixResponse>>;
  updateMatrix: (request: UpdateRubricMatrixRequest) => Promise<AppResult<UpdateRubricMatrixResponse>>;
};

interface LocalDb {
  rubric: RubricDto;
  details: RubricDetailDto[];
  scores: RubricScoreDto[];
}

const localDb: LocalDb = (() => {
  const rubricId = 'rubric-1';
  const categories = ['Content', 'Organization', 'Grammar'];
  const scoreValues = [5, 4, 3, 2, 1];

  const rubric: RubricDto = {
    entityUuid: rubricId,
    name: 'ESL Writing Rubric',
    type: 'detailed'
  };

  const details: RubricDetailDto[] = [];
  const scores: RubricScoreDto[] = [];

  let detailNumber = 1;
  let scoreNumber = 1;

  for (const category of categories) {
    for (const scoreValue of scoreValues) {
      const detailId = `detail-${detailNumber++}`;
      details.push({
        uuid: detailId,
        entityUuid: rubricId,
        category,
        description: `${category} descriptor at score ${scoreValue}.`
      });
      scores.push({
        uuid: `score-${scoreNumber++}`,
        detailsUuid: detailId,
        scoreValues: scoreValue
      });
    }
  }

  return { rubric, details, scores };
})();

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(16).slice(2)}`;
}

function toError(resultError: AppError): Error {
  return new Error(resultError.message || 'Rubric request failed.');
}

function getPreloadRubricApi(): RubricApi | undefined {
  const appWindow = window as Window & { api?: { rubric?: Partial<RubricApi> } };
  const rubricApi = appWindow.api?.rubric;
  if (!rubricApi) {
    return undefined;
  }
  if (
    typeof rubricApi.listRubrics !== 'function' ||
    typeof rubricApi.getMatrix !== 'function' ||
    typeof rubricApi.updateMatrix !== 'function'
  ) {
    return undefined;
  }
  return rubricApi as RubricApi;
}

function isNotImplemented(result: AppResult<unknown>): boolean {
  return !result.ok && result.error.code === 'NOT_IMPLEMENTED';
}

async function listRubricsLocal(): Promise<ListRubricsResponse> {
  return delay({ rubrics: [localDb.rubric] });
}

async function getMatrixLocal(request: GetRubricMatrixRequest): Promise<GetRubricMatrixResponse> {
  if (request.rubricId !== localDb.rubric.entityUuid) {
    throw new Error('Rubric not found.');
  }
  return delay({
    rubric: localDb.rubric,
    details: localDb.details,
    scores: localDb.scores
  });
}

async function updateMatrixLocal(request: UpdateRubricMatrixRequest): Promise<UpdateRubricMatrixResponse> {
  if (request.rubricId !== localDb.rubric.entityUuid) {
    throw new Error('Rubric not found.');
  }

  const operation = request.operation;
  if (operation.type === 'setRubricName') {
    localDb.rubric.name = operation.name;
  }

  if (operation.type === 'updateCellDescription') {
    const detail = localDb.details.find((entry) => entry.uuid === operation.detailId);
    if (!detail) {
      throw new Error('Rubric detail not found.');
    }
    detail.description = operation.description;
  }

  if (operation.type === 'updateCategoryName') {
    for (const detail of localDb.details) {
      if (detail.category === operation.from) {
        detail.category = operation.to;
      }
    }
  }

  if (operation.type === 'updateScoreValue') {
    for (const score of localDb.scores) {
      if (score.scoreValues === operation.from) {
        score.scoreValues = operation.to;
      }
    }
  }

  if (operation.type === 'createCategory') {
    const scoreValues = Array.from(new Set(localDb.scores.map((score) => score.scoreValues))).sort(
      (left, right) => right - left
    );

    for (const scoreValue of scoreValues) {
      const detailId = newId('detail');
      localDb.details.push({
        uuid: detailId,
        entityUuid: request.rubricId,
        category: operation.name,
        description: ''
      });
      localDb.scores.push({
        uuid: newId('score'),
        detailsUuid: detailId,
        scoreValues: scoreValue
      });
    }
  }

  if (operation.type === 'createScore') {
    const categories = Array.from(new Set(localDb.details.map((detail) => detail.category)));

    for (const category of categories) {
      const detailId = newId('detail');
      localDb.details.push({
        uuid: detailId,
        entityUuid: request.rubricId,
        category,
        description: ''
      });
      localDb.scores.push({
        uuid: newId('score'),
        detailsUuid: detailId,
        scoreValues: operation.value
      });
    }
  }

  return delay({ success: true });
}

export async function listRubrics(): Promise<ListRubricsResponse> {
  const api = getPreloadRubricApi();
  if (!api) {
    return listRubricsLocal();
  }

  const result = await api.listRubrics();
  if (result.ok) {
    return result.data;
  }
  if (isNotImplemented(result)) {
    return listRubricsLocal();
  }
  throw toError(result.error);
}

export async function getRubricMatrix(rubricId: string): Promise<GetRubricMatrixResponse> {
  const request: GetRubricMatrixRequest = { rubricId };
  const api = getPreloadRubricApi();
  if (!api) {
    return getMatrixLocal(request);
  }

  const result = await api.getMatrix(request);
  if (result.ok) {
    return result.data;
  }
  if (isNotImplemented(result)) {
    return getMatrixLocal(request);
  }
  throw toError(result.error);
}

export async function updateRubricMatrix(request: UpdateRubricMatrixRequest): Promise<UpdateRubricMatrixResponse> {
  const api = getPreloadRubricApi();
  if (!api) {
    return updateMatrixLocal(request);
  }

  const result = await api.updateMatrix(request);
  if (result.ok) {
    return result.data;
  }
  if (isNotImplemented(result)) {
    return updateMatrixLocal(request);
  }
  throw toError(result.error);
}

const categoryAxisId = (name: string): string => `cat:${name}`;
const scoreAxisId = (value: number): string => `score:${value}`;
const makeKey = (categoryId: string, scoreId: string): string => `${categoryId}:${scoreId}`;

export function matrixToRubricSourceData(matrix: GetRubricMatrixResponse): RubricSourceData {
  const scoreByDetailId: Record<string, RubricScoreDto> = {};
  for (const score of matrix.scores) {
    scoreByDetailId[score.detailsUuid] = score;
  }

  const categoryNames = new Set<string>();
  const scoreValues = new Set<number>();

  for (const detail of matrix.details) {
    const score = scoreByDetailId[detail.uuid];
    if (!score) continue;
    categoryNames.add(detail.category);
    scoreValues.add(score.scoreValues);
  }

  const categories = Array.from(categoryNames).map((name) => ({ id: categoryAxisId(name), name }));
  const scores = Array.from(scoreValues)
    .sort((left, right) => right - left)
    .map((value) => ({ id: scoreAxisId(value), value }));

  const cells: NonNullable<RubricSourceData['cells']> = [];
  for (const detail of matrix.details) {
    const score = scoreByDetailId[detail.uuid];
    if (!score) continue;
    cells.push({
      categoryId: categoryAxisId(detail.category),
      scoreId: scoreAxisId(score.scoreValues),
      detailId: detail.uuid,
      scoreRowId: score.uuid,
      description: detail.description ?? ''
    });
  }

  for (const category of categories) {
    for (const score of scores) {
      const key = makeKey(category.id, score.id);
      const exists = cells.some((cell) => makeKey(cell.categoryId, cell.scoreId) === key);
      if (!exists) {
        cells.push({
          categoryId: category.id,
          scoreId: score.id,
          detailId: `temp_detail:${key}`,
          scoreRowId: `temp_score:${key}`,
          description: ''
        });
      }
    }
  }

  return {
    rubricId: matrix.rubric.entityUuid,
    rubricName: matrix.rubric.name,
    categories,
    scores,
    cells
  };
}
