import type { AppError, AppResult } from '../../../../../electron/shared/appResult';
import type { AddFeedbackRequest, AddFeedbackResponse, ListFeedbackResponse } from '../../../../../electron/shared/assessmentContracts';

type AssessmentApi = {
  listFeedback: (request: { fileId: string }) => Promise<AppResult<ListFeedbackResponse>>;
  addFeedback: (request: AddFeedbackRequest) => Promise<AppResult<AddFeedbackResponse>>;
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

export async function addFeedback(request: AddFeedbackRequest): Promise<AddFeedbackResponse['feedback']> {
  const assessmentApi = getAssessmentApi();
  const result = await assessmentApi.addFeedback(request);
  if (!result.ok) {
    throw toError(result.error);
  }
  return result.data.feedback;
}
