import type { AppError, AppResult } from '../shared/appResult';
import type {
  ApplyFeedbackRequest,
  ApplyFeedbackResponse,
  AddFeedbackRequest,
  AddFeedbackResponse,
  DeleteFeedbackRequest,
  DeleteFeedbackResponse,
  EditFeedbackRequest,
  EditFeedbackResponse,
  ExtractDocumentRequest,
  ExtractDocumentResponse,
  GenerateFeedbackDocumentRequest,
  GenerateFeedbackDocumentResponse,
  ListFeedbackRequest,
  ListFeedbackResponse,
  RequestLlmAssessmentRequest,
  RequestLlmAssessmentResponse,
  SendFeedbackToLlmRequest,
  SendFeedbackToLlmResponse
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
    editFeedback(request: EditFeedbackRequest): Promise<ApiResult<EditFeedbackResponse>>;
    deleteFeedback(request: DeleteFeedbackRequest): Promise<ApiResult<DeleteFeedbackResponse>>;
    applyFeedback(request: ApplyFeedbackRequest): Promise<ApiResult<ApplyFeedbackResponse>>;
    sendFeedbackToLlm(request: SendFeedbackToLlmRequest): Promise<ApiResult<SendFeedbackToLlmResponse>>;
    generateFeedbackDocument(
      request: GenerateFeedbackDocumentRequest
    ): Promise<ApiResult<GenerateFeedbackDocumentResponse>>;
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
