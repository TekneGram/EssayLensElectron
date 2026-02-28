import type { AppResult } from '../../../electron/shared/appResult';
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
  UpdateRubricMatrixResponse
} from '../../../electron/shared/rubricContracts';

export interface RubricPort {
  listRubrics(): Promise<AppResult<ListRubricsResponse>>;
  createRubric(request: CreateRubricRequest): Promise<AppResult<CreateRubricResponse>>;
  cloneRubric(request: CloneRubricRequest): Promise<AppResult<CloneRubricResponse>>;
  deleteRubric(request: DeleteRubricRequest): Promise<AppResult<DeleteRubricResponse>>;
  getFileScores(request: GetFileRubricScoresRequest): Promise<AppResult<GetFileRubricScoresResponse>>;
  saveFileScores(request: SaveFileRubricScoresRequest): Promise<AppResult<SaveFileRubricScoresResponse>>;
  clearAppliedRubric(request: ClearAppliedRubricRequest): Promise<AppResult<ClearAppliedRubricResponse>>;
  getGradingContext(request: GetRubricGradingContextRequest): Promise<AppResult<GetRubricGradingContextResponse>>;
  getMatrix(request: GetRubricMatrixRequest): Promise<AppResult<GetRubricMatrixResponse>>;
  updateMatrix(request: UpdateRubricMatrixRequest): Promise<AppResult<UpdateRubricMatrixResponse>>;
  setLastUsed(request: SetLastUsedRubricRequest): Promise<AppResult<SetLastUsedRubricResponse>>;
}
