import type { AppError, AppResult } from '../shared/appResult';
import type {
  ClearLlmSessionRequest,
  ClearLlmSessionResponse,
  CreateLlmSessionRequest,
  CreateLlmSessionResponse,
  GetLlmSessionTurnsRequest,
  GetLlmSessionTurnsResponse,
  ListLlmSessionsByFileRequest,
  ListLlmSessionsByFileResponse
} from '../shared/llm-session';
import type {
  GetLlmServerStatusResponse,
  StartLlmServerResponse,
  StopLlmServerResponse
} from '../shared/llm-server';
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
import type {
  ChatStreamChunkEvent,
  ListMessagesResponse,
  SendChatMessageRequest,
  SendChatMessageResponse
} from '../shared/chatContracts';
import type {
  DeleteDownloadedModelRequest,
  DeleteDownloadedModelResponse,
  DownloadModelRequest,
  DownloadModelResponse,
  DownloadProgressEvent,
  GetActiveModelResponse,
  GetSettingsResponse,
  ListCatalogModelsResponse,
  ListDownloadedModelsResponse,
  ResetSettingsToDefaultsResponse,
  SelectModelRequest,
  SelectModelResponse,
  UpdateSettingsRequest,
  UpdateSettingsResponse
} from '../shared/llmManagerContracts';
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
} from '../shared/rubricContracts';
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
    listRubrics(): Promise<ApiResult<ListRubricsResponse>>;
    createRubric(request: CreateRubricRequest): Promise<ApiResult<CreateRubricResponse>>;
    cloneRubric(request: CloneRubricRequest): Promise<ApiResult<CloneRubricResponse>>;
    deleteRubric(request: DeleteRubricRequest): Promise<ApiResult<DeleteRubricResponse>>;
    getFileScores(request: GetFileRubricScoresRequest): Promise<ApiResult<GetFileRubricScoresResponse>>;
    saveFileScores(request: SaveFileRubricScoresRequest): Promise<ApiResult<SaveFileRubricScoresResponse>>;
    clearAppliedRubric(request: ClearAppliedRubricRequest): Promise<ApiResult<ClearAppliedRubricResponse>>;
    getGradingContext(request: GetRubricGradingContextRequest): Promise<ApiResult<GetRubricGradingContextResponse>>;
    getMatrix(request: GetRubricMatrixRequest): Promise<ApiResult<GetRubricMatrixResponse>>;
    updateMatrix(request: UpdateRubricMatrixRequest): Promise<ApiResult<UpdateRubricMatrixResponse>>;
    setLastUsed(request: SetLastUsedRubricRequest): Promise<ApiResult<SetLastUsedRubricResponse>>;
  };
  chat: {
    listMessages(fileId?: string): Promise<ApiResult<ListMessagesResponse>>;
    sendMessage(request: SendChatMessageRequest): Promise<ApiResult<SendChatMessageResponse>>;
    onStreamChunk(listener: (event: ChatStreamChunkEvent) => void): () => void;
  };
  llmManager: {
    listCatalogModels(): Promise<ApiResult<ListCatalogModelsResponse>>;
    listDownloadedModels(): Promise<ApiResult<ListDownloadedModelsResponse>>;
    getActiveModel(): Promise<ApiResult<GetActiveModelResponse>>;
    downloadModel(request: DownloadModelRequest): Promise<ApiResult<DownloadModelResponse>>;
    deleteDownloadedModel(request: DeleteDownloadedModelRequest): Promise<ApiResult<DeleteDownloadedModelResponse>>;
    onDownloadProgress(listener: (event: DownloadProgressEvent) => void): () => void;
    selectModel(request: SelectModelRequest): Promise<ApiResult<SelectModelResponse>>;
    getSettings(): Promise<ApiResult<GetSettingsResponse>>;
    updateSettings(request: UpdateSettingsRequest): Promise<ApiResult<UpdateSettingsResponse>>;
    resetSettingsToDefaults(): Promise<ApiResult<ResetSettingsToDefaultsResponse>>;
  };
  llmServer: {
    start(): Promise<ApiResult<StartLlmServerResponse>>;
    stop(): Promise<ApiResult<StopLlmServerResponse>>;
    status(): Promise<ApiResult<GetLlmServerStatusResponse>>;
  };
  llmSession: {
    create(request: CreateLlmSessionRequest): Promise<ApiResult<CreateLlmSessionResponse>>;
    clear(request: ClearLlmSessionRequest): Promise<ApiResult<ClearLlmSessionResponse>>;
    getTurns(request: GetLlmSessionTurnsRequest): Promise<ApiResult<GetLlmSessionTurnsResponse>>;
    listByFile(request: ListLlmSessionsByFileRequest): Promise<ApiResult<ListLlmSessionsByFileResponse>>;
  };
}

declare global {
  interface Window {
    api: EssayLensApi;
  }
}
