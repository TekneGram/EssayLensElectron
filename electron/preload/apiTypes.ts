import type { AppError, AppResult } from '../shared/appResult';
import type {
  AddFeedbackRequest,
  AddFeedbackResponse,
  ExtractDocumentRequest,
  ExtractDocumentResponse,
  ListFeedbackRequest,
  ListFeedbackResponse,
  RequestLlmAssessmentRequest,
  RequestLlmAssessmentResponse
} from '../shared/assessmentContracts';
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
    extractDocument(request: ExtractDocumentRequest): Promise<ApiResult<ExtractDocumentResponse>>;
    listFeedback(request: ListFeedbackRequest): Promise<ApiResult<ListFeedbackResponse>>;
    addFeedback(request: AddFeedbackRequest): Promise<ApiResult<AddFeedbackResponse>>;
    requestLlmAssessment(request: RequestLlmAssessmentRequest): Promise<ApiResult<RequestLlmAssessmentResponse>>;
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
