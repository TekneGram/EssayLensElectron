import type { AppError, AppResult } from '../../../../../electron/shared/appResult';
import type {
  CloneRubricResponse,
  CreateRubricRequest,
  CreateRubricResponse,
  DeleteRubricResponse,
  GetRubricMatrixRequest,
  GetRubricMatrixResponse,
  ListRubricsResponse,
  RubricDetailDto,
  RubricScoreDto,
  SetLastUsedRubricRequest,
  SetLastUsedRubricResponse,
  UpdateRubricMatrixRequest,
  UpdateRubricMatrixResponse
} from '../../../../../electron/shared/rubricContracts';
import type { RubricSourceData } from './types';

type RubricApi = {
  listRubrics: () => Promise<AppResult<ListRubricsResponse>>;
  createRubric: (request: CreateRubricRequest) => Promise<AppResult<CreateRubricResponse>>;
  cloneRubric: (request: { rubricId: string }) => Promise<AppResult<CloneRubricResponse>>;
  deleteRubric: (request: { rubricId: string }) => Promise<AppResult<DeleteRubricResponse>>;
  getMatrix: (request: GetRubricMatrixRequest) => Promise<AppResult<GetRubricMatrixResponse>>;
  updateMatrix: (request: UpdateRubricMatrixRequest) => Promise<AppResult<UpdateRubricMatrixResponse>>;
  setLastUsed: (request: SetLastUsedRubricRequest) => Promise<AppResult<SetLastUsedRubricResponse>>;
};

function toError(resultError: AppError): Error {
  return new Error(resultError.message || 'Rubric request failed.');
}

function getPreloadRubricApi(): Partial<RubricApi> {
  const appWindow = window as Window & { api?: { rubric?: Partial<RubricApi> } };
  const rubricApi = appWindow.api?.rubric;
  if (!rubricApi) {
    throw new Error('window.api.rubric is not available.');
  }
  return rubricApi;
}

export async function listRubrics(): Promise<ListRubricsResponse> {
  const api = getPreloadRubricApi();
  if (typeof api.listRubrics !== 'function') {
    throw new Error('window.api.rubric.listRubrics is not available.');
  }
  const result = await api.listRubrics();
  if (result.ok) {
    return result.data;
  }
  throw toError(result.error);
}

export async function createRubric(name = 'New Rubric'): Promise<CreateRubricResponse> {
  const api = getPreloadRubricApi();
  if (typeof api.createRubric !== 'function') {
    throw new Error('window.api.rubric.createRubric is not available.');
  }
  const result = await api.createRubric({ name });
  if (result.ok) {
    return result.data;
  }
  throw toError(result.error);
}

export async function cloneRubric(rubricId: string): Promise<CloneRubricResponse> {
  const api = getPreloadRubricApi();
  if (typeof api.cloneRubric !== 'function') {
    throw new Error('window.api.rubric.cloneRubric is not available.');
  }
  const result = await api.cloneRubric({ rubricId });
  if (result.ok) {
    return result.data;
  }
  throw toError(result.error);
}

export async function deleteRubric(rubricId: string): Promise<DeleteRubricResponse> {
  const api = getPreloadRubricApi();
  if (typeof api.deleteRubric !== 'function') {
    throw new Error('window.api.rubric.deleteRubric is not available.');
  }
  const result = await api.deleteRubric({ rubricId });
  if (result.ok) {
    return result.data;
  }
  throw toError(result.error);
}

export async function getRubricMatrix(rubricId: string): Promise<GetRubricMatrixResponse> {
  const request: GetRubricMatrixRequest = { rubricId };
  const api = getPreloadRubricApi();
  if (typeof api.getMatrix !== 'function') {
    throw new Error('window.api.rubric.getMatrix is not available.');
  }
  const result = await api.getMatrix(request);
  if (result.ok) {
    return result.data;
  }
  throw toError(result.error);
}

export async function updateRubricMatrix(request: UpdateRubricMatrixRequest): Promise<UpdateRubricMatrixResponse> {
  const api = getPreloadRubricApi();
  if (typeof api.updateMatrix !== 'function') {
    throw new Error('window.api.rubric.updateMatrix is not available.');
  }
  const result = await api.updateMatrix(request);
  if (result.ok) {
    return result.data;
  }
  throw toError(result.error);
}

export async function setLastUsedRubric(rubricId: string): Promise<SetLastUsedRubricResponse> {
  const api = getPreloadRubricApi();
  if (typeof api.setLastUsed !== 'function') {
    throw new Error('window.api.rubric.setLastUsed is not available.');
  }
  const result = await api.setLastUsed({ rubricId });
  if (result.ok) {
    return result.data;
  }
  throw toError(result.error);
}

const makeKey = (categoryId: string, scoreId: string): string => `${categoryId}:${scoreId}`;

export function matrixToRubricSourceData(matrix: GetRubricMatrixResponse): RubricSourceData {
  const scoreByDetailId: Record<string, RubricScoreDto> = {};
  for (const score of matrix.scores) {
    scoreByDetailId[score.detailsUuid] = score;
  }

  const detailsByCategory = new Map<string, RubricDetailDto[]>();
  const scoresByValue = new Map<number, RubricScoreDto[]>();

  for (const detail of matrix.details) {
    const score = scoreByDetailId[detail.uuid];
    if (!score) continue;
    const categoryDetails = detailsByCategory.get(detail.category) ?? [];
    categoryDetails.push(detail);
    detailsByCategory.set(detail.category, categoryDetails);

    const scoreRows = scoresByValue.get(score.scoreValues) ?? [];
    scoreRows.push(score);
    scoresByValue.set(score.scoreValues, scoreRows);
  }

  const categoryNames = Array.from(detailsByCategory.keys()).sort((left, right) => left.localeCompare(right));
  const categoryIdByName = new Map<string, string>();
  for (const categoryName of categoryNames) {
    const details = detailsByCategory.get(categoryName) ?? [];
    const representativeDetail = [...details].sort((left, right) => left.uuid.localeCompare(right.uuid))[0];
    const stableId = representativeDetail ? `cat:${representativeDetail.uuid}` : `cat:${categoryName}`;
    categoryIdByName.set(categoryName, stableId);
  }

  const scoreValues = Array.from(scoresByValue.keys()).sort((left, right) => right - left);
  const scoreIdByValue = new Map<number, string>();
  for (const scoreValue of scoreValues) {
    const scoreRows = scoresByValue.get(scoreValue) ?? [];
    const representativeScore = [...scoreRows].sort((left, right) => left.uuid.localeCompare(right.uuid))[0];
    const stableId = representativeScore ? `score:${representativeScore.uuid}` : `score:${scoreValue}`;
    scoreIdByValue.set(scoreValue, stableId);
  }

  const categories = categoryNames.map((name) => ({
    id: categoryIdByName.get(name) ?? `cat:${name}`,
    name
  }));
  const scores = scoreValues
    .sort((left, right) => right - left)
    .map((value) => ({ id: scoreIdByValue.get(value) ?? `score:${value}`, value }));

  const cells: NonNullable<RubricSourceData['cells']> = [];
  for (const detail of matrix.details) {
    const score = scoreByDetailId[detail.uuid];
    if (!score) continue;
    const categoryId = categoryIdByName.get(detail.category);
    const scoreId = scoreIdByValue.get(score.scoreValues);
    if (!categoryId || !scoreId) continue;
    cells.push({
      categoryId,
      scoreId,
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
