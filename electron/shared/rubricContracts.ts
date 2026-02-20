export type RubricType = 'flat' | 'detailed';

export interface RubricDto {
  entityUuid: string;
  name: string;
  type: RubricType;
}

export interface RubricDetailDto {
  uuid: string;
  entityUuid: string;
  category: string;
  description: string;
}

export interface RubricScoreDto {
  uuid: string;
  detailsUuid: string;
  scoreValues: number;
}

export interface FileRubricInstanceDto {
  uuid: string;
  fileEntityUuid: string;
  rubricEntityUuid: string;
  createdAt: string;
  editedAt?: string;
}

export interface FileRubricScoreDto {
  uuid: string;
  rubricInstanceUuid: string;
  rubricDetailUuid: string;
  assignedScore: string;
  createdAt: string;
  editedAt?: string;
}

export interface ListRubricsResponse {
  rubrics: RubricDto[];
}

export interface GetRubricMatrixRequest {
  rubricId: string;
}

export interface GetRubricMatrixResponse {
  rubric: RubricDto;
  details: RubricDetailDto[];
  scores: RubricScoreDto[];
}

export type UpdateRubricOperation =
  | { type: 'setRubricName'; name: string }
  | { type: 'updateCellDescription'; detailId: string; description: string }
  | { type: 'updateCategoryName'; from: string; to: string }
  | { type: 'updateScoreValue'; from: number; to: number }
  | { type: 'createCategory'; name: string }
  | { type: 'createScore'; value: number };

export interface UpdateRubricMatrixRequest {
  rubricId: string;
  operation: UpdateRubricOperation;
}

export interface UpdateRubricMatrixResponse {
  success: true;
}

export interface GetFileRubricScoresRequest {
  fileId: string;
  rubricId: string;
}

export interface GetFileRubricScoresResponse {
  instance: FileRubricInstanceDto | null;
  scores: FileRubricScoreDto[];
}

export interface SaveFileRubricScoresRequest {
  fileId: string;
  rubricId: string;
  selections: Array<{
    rubricDetailId: string;
    assignedScore: string;
  }>;
}

export interface SaveFileRubricScoresResponse {
  instance: FileRubricInstanceDto;
  scores: FileRubricScoreDto[];
}
