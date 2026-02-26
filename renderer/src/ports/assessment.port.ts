import type { AppResult } from '../../../electron/shared/appResult';
import type {
  AddFeedbackRequest,
  AddFeedbackResponse,
  ApplyFeedbackRequest,
  ApplyFeedbackResponse,
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
} from '../../../electron/shared/assessmentContracts';

export interface AssessmentPort {
  extractDocument(request: ExtractDocumentRequest): Promise<AppResult<ExtractDocumentResponse>>;
  listFeedback(request: ListFeedbackRequest): Promise<AppResult<ListFeedbackResponse>>;
  addFeedback(request: AddFeedbackRequest): Promise<AppResult<AddFeedbackResponse>>;
  editFeedback(request: EditFeedbackRequest): Promise<AppResult<EditFeedbackResponse>>;
  deleteFeedback(request: DeleteFeedbackRequest): Promise<AppResult<DeleteFeedbackResponse>>;
  applyFeedback(request: ApplyFeedbackRequest): Promise<AppResult<ApplyFeedbackResponse>>;
  sendFeedbackToLlm(request: SendFeedbackToLlmRequest): Promise<AppResult<SendFeedbackToLlmResponse>>;
  generateFeedbackDocument(request: GenerateFeedbackDocumentRequest): Promise<AppResult<GenerateFeedbackDocumentResponse>>;
  requestLlmAssessment(request: RequestLlmAssessmentRequest): Promise<AppResult<RequestLlmAssessmentResponse>>;
}
