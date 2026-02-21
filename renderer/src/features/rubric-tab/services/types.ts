export type RubricId = string;
export type CategoryId = string;
export type ScoreId = string;
export type CellKey = string;

export interface RubricCategory {
  id: CategoryId;
  name: string;
}

export interface RubricScore {
  id: ScoreId;
  value: number;
}

export interface RubricCell {
  key: CellKey;
  categoryId: CategoryId;
  scoreId: ScoreId;
  description: string;
  detailId?: string;
  scoreRowId?: string;
}

export interface NormalizedRubric {
  rubricId: RubricId;
  rubricName: string;
  categoryOrder: CategoryId[];
  scoreOrder: ScoreId[];
  categoriesById: Record<CategoryId, RubricCategory>;
  scoresById: Record<ScoreId, RubricScore>;
  cellsByKey: Record<CellKey, RubricCell>;
}

export interface RubricSourceCategory {
  id?: CategoryId;
  name: string;
}

export interface RubricSourceScore {
  id?: ScoreId;
  value: number;
}

export interface RubricSourceCell {
  categoryId: CategoryId;
  scoreId: ScoreId;
  description?: string;
  detailId?: string;
  scoreRowId?: string;
}

export interface RubricSourceData {
  rubricId?: RubricId;
  rubricName?: string;
  categories?: RubricSourceCategory[];
  scores?: RubricSourceScore[];
  cells?: RubricSourceCell[];
}

export interface RubricClassNames {
  root: string;
  toolbar: string;
  tableWrap: string;
  table: string;
  axisField: string;
  axisInput: string;
  deleteButton: string;
  cellTextarea: string;
}

export type RubricInteractionMode = 'editing' | 'viewing' | 'grading';
export type RubricDisplayMode = 'full' | 'compact-score';

export interface RubricForReactProps {
  sourceData?: RubricSourceData | NormalizedRubric;
  isGrading?: boolean;
  canEdit?: boolean;
  className?: string;
  classes?: Partial<RubricClassNames>;
  mode?: 'editing' | 'viewing';
  displayMode?: RubricDisplayMode;
  onModeChange?: (mode: 'editing' | 'viewing') => void;
  onSelectedCellKeysChange?: (selectedCellKeys: string[]) => void;
  initialSelectedCellKeys?: string[];
  onSetRubricName?: (name: string) => void | Promise<void>;
  onAddCategory?: (name: string) => void | Promise<void>;
  onAddScore?: (value: number) => void | Promise<void>;
  onRenameCategory?: (from: string, to: string) => void | Promise<void>;
  onRemoveCategory?: (categoryName: string) => void | Promise<void>;
  onSetScoreValue?: (from: number, to: number) => void | Promise<void>;
  onRemoveScore?: (scoreValue: number) => void | Promise<void>;
  onSetCellDescription?: (detailId: string, description: string) => void | Promise<void>;
  onChange?: (next: NormalizedRubric) => void;
}
