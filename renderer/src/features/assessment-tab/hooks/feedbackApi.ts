import type { AppError, AppResult } from '../../../../../electron/shared/appResult';
import type {
  AddFeedbackRequest,
  AddFeedbackResponse,
  ApplyFeedbackRequest,
  ApplyFeedbackResponse,
  DeleteFeedbackRequest,
  DeleteFeedbackResponse,
  EditFeedbackRequest,
  EditFeedbackResponse,
  ExtractDocumentResponse,
  GenerateFeedbackDocumentResponse,
  ListFeedbackResponse,
  SendFeedbackToLlmRequest,
  SendFeedbackToLlmResponse
} from '../../../../../electron/shared/assessmentContracts';

type AssessmentApi = {
  extractDocument: (request: { fileId: string }) => Promise<AppResult<ExtractDocumentResponse>>;
  listFeedback: (request: { fileId: string }) => Promise<AppResult<ListFeedbackResponse>>;
  addFeedback: (request: AddFeedbackRequest) => Promise<AppResult<AddFeedbackResponse>>;
  editFeedback: (request: EditFeedbackRequest) => Promise<AppResult<EditFeedbackResponse>>;
  deleteFeedback: (request: DeleteFeedbackRequest) => Promise<AppResult<DeleteFeedbackResponse>>;
  applyFeedback: (request: ApplyFeedbackRequest) => Promise<AppResult<ApplyFeedbackResponse>>;
  sendFeedbackToLlm: (request: SendFeedbackToLlmRequest) => Promise<AppResult<SendFeedbackToLlmResponse>>;
  generateFeedbackDocument: (request: { fileId: string }) => Promise<AppResult<GenerateFeedbackDocumentResponse>>;
};

function getAssessmentApi(): AssessmentApi {
  const appWindow = window as Window & { api?: { assessment?: AssessmentApi } };
  if (!appWindow.api?.assessment) {
    throw new Error('window.api.assessment is not available.');
  }
  return appWindow.api.assessment;
}

function toError(resultError: AppError): Error {
  return new Error(resultError.message || 'Assessment request failed.');
}

export async function listFeedback(fileId: string): Promise<ListFeedbackResponse['feedback']> {
  const assessmentApi = getAssessmentApi();
  const result = await assessmentApi.listFeedback({ fileId });
  if (!result.ok) {
    throw toError(result.error);
  }
  return result.data.feedback;
}

export async function extractDocument(fileId: string): Promise<ExtractDocumentResponse> {
  const assessmentApi = getAssessmentApi();
  const result = await assessmentApi.extractDocument({ fileId });
  if (!result.ok) {
    throw toError(result.error);
  }
  return result.data;
}

export async function addFeedback(request: AddFeedbackRequest): Promise<AddFeedbackResponse['feedback']> {
  const assessmentApi = getAssessmentApi();
  const result = await assessmentApi.addFeedback(request);
  if (!result.ok) {
    throw toError(result.error);
  }
  return result.data.feedback;
}

export async function editFeedback(request: EditFeedbackRequest): Promise<void> {
  const assessmentApi = getAssessmentApi();
  const result = await assessmentApi.editFeedback(request);
  if (!result.ok) {
    throw toError(result.error);
  }
}

export async function deleteFeedback(request: DeleteFeedbackRequest): Promise<void> {
  const assessmentApi = getAssessmentApi();
  const result = await assessmentApi.deleteFeedback(request);
  if (!result.ok) {
    throw toError(result.error);
  }
}

export async function applyFeedback(request: ApplyFeedbackRequest): Promise<void> {
  const assessmentApi = getAssessmentApi();
  const result = await assessmentApi.applyFeedback(request);
  if (!result.ok) {
    throw toError(result.error);
  }
}

export async function sendFeedbackToLlm(request: SendFeedbackToLlmRequest): Promise<void> {
  const assessmentApi = getAssessmentApi();
  const result = await assessmentApi.sendFeedbackToLlm(request);
  if (!result.ok) {
    throw toError(result.error);
  }
}

export async function generateFeedbackDocument(fileId: string): Promise<GenerateFeedbackDocumentResponse> {
  const assessmentApi = getAssessmentApi();
  const result = await assessmentApi.generateFeedbackDocument({ fileId });
  if (!result.ok) {
    throw toError(result.error);
  }
  return result.data;
}
