import type { CategoryId, CellKey, ScoreId } from './rubricModel';

export function createCellKey(categoryId: CategoryId, scoreId: ScoreId): CellKey {
  return `${categoryId}:${scoreId}`;
}
