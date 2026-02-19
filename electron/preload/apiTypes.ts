import type { AppError, AppResult } from '../shared/appResult';
import type { ListMessagesResponse, SendChatMessageRequest, SendChatMessageResponse } from '../shared/chatContracts';
import type { GetCurrentFolderResponse, ListFilesResponse, SelectFolderResponse } from '../shared/workspaceContracts';

export type ApiError = AppError;
export type ApiResult<T> = AppResult<T>;

export interface EssayLensApi {
  workspace: {
    selectFolder(): Promise<ApiResult<SelectFolderResponse>>;
    listFiles(folderId: string): Promise<ApiResult<ListFilesResponse>>;
    getCurrentFolder(): Promise<ApiResult<GetCurrentFolderResponse>>;
  };
  assessment: {
    extractDocument(fileId: string): Promise<ApiResult<unknown>>;
    listFeedback(fileId: string): Promise<ApiResult<unknown>>;
    addFeedback(request: unknown): Promise<ApiResult<unknown>>;
    requestLlmAssessment(request: unknown): Promise<ApiResult<unknown>>;
  };
  rubric: {
    listRubrics(): Promise<ApiResult<unknown>>;
    getMatrix(rubricId: string): Promise<ApiResult<unknown>>;
    updateMatrix(request: unknown): Promise<ApiResult<unknown>>;
  };
  chat: {
    listMessages(fileId?: string): Promise<ApiResult<ListMessagesResponse>>;
    sendMessage(request: SendChatMessageRequest): Promise<ApiResult<SendChatMessageResponse>>;
  };
}

declare global {
  interface Window {
    api: EssayLensApi;
  }
}
