import type { AppError, AppResult } from '../shared/appResult';
import type { GetCurrentFolderResultData, ListFilesResultData, SelectFolderResultData } from '../shared/workspaceContracts';

export type ApiError = AppError;
export type ApiResult<T> = AppResult<T>;

export interface EssayLensApi {
  workspace: {
    selectFolder(): Promise<ApiResult<SelectFolderResultData>>;
    listFiles(folderId: string): Promise<ApiResult<ListFilesResultData>>;
    getCurrentFolder(): Promise<ApiResult<GetCurrentFolderResultData>>;
  };
  assessment: {
    extractDocument(fileId: string): Promise<ApiResult<unknown>>;
    listFeedback(fileId: string): Promise<ApiResult<unknown>>;
    addFeedback(payload: unknown): Promise<ApiResult<unknown>>;
    requestLlmAssessment(payload: unknown): Promise<ApiResult<unknown>>;
  };
  rubric: {
    listRubrics(): Promise<ApiResult<unknown>>;
    getMatrix(rubricId: string): Promise<ApiResult<unknown>>;
    updateMatrix(payload: unknown): Promise<ApiResult<unknown>>;
  };
  chat: {
    listMessages(fileId?: string): Promise<ApiResult<unknown>>;
    sendMessage(payload: unknown): Promise<ApiResult<unknown>>;
  };
}

declare global {
  interface Window {
    api: EssayLensApi;
  }
}
