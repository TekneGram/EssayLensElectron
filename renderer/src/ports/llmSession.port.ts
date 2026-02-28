import type { AppResult } from '../../../electron/shared/appResult';
import type {
  ClearLlmSessionRequest,
  ClearLlmSessionResponse,
  CreateLlmSessionRequest,
  CreateLlmSessionResponse,
  DeleteLlmSessionRequest,
  DeleteLlmSessionResponse,
  GetLlmSessionTurnsRequest,
  GetLlmSessionTurnsResponse,
  ListLlmSessionsByFileRequest,
  ListLlmSessionsByFileResponse
} from '../../../electron/shared/llm-session';

export interface LlmSessionPort {
  create(request: CreateLlmSessionRequest): Promise<AppResult<CreateLlmSessionResponse>>;
  clear(request: ClearLlmSessionRequest): Promise<AppResult<ClearLlmSessionResponse>>;
  delete(request: DeleteLlmSessionRequest): Promise<AppResult<DeleteLlmSessionResponse>>;
  getTurns(request: GetLlmSessionTurnsRequest): Promise<AppResult<GetLlmSessionTurnsResponse>>;
  listByFile(request: ListLlmSessionsByFileRequest): Promise<AppResult<ListLlmSessionsByFileResponse>>;
}
