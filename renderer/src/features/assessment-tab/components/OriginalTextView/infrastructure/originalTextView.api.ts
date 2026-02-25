import type { AppError, AppResult } from '../../../../../../../electron/shared/appResult';
import type { ExtractDocumentResponse } from '../../../../../../../electron/shared/assessmentContracts';

type AssessmentApi = {
  extractDocument: (request: { fileId: string }) => Promise<AppResult<ExtractDocumentResponse>>;
};

function getOriginalTextViewApi(): AssessmentApi {
  const appWindow = window as Window & { api?: { assessment?: AssessmentApi } };
  if (!appWindow.api?.assessment) {
    throw new Error('window.api.assessment is not available.');
  }
  return appWindow.api.assessment;
}

function toError(resultError: AppError): Error {
  return new Error(resultError.message || 'Document extraction failed.');
}

export async function fetchExtractedDocument(fileId: string): Promise<ExtractDocumentResponse> {
  const api = getOriginalTextViewApi();
  const result = await api.extractDocument({ fileId });
  if (!result.ok) {
    throw toError(result.error);
  }
  return result.data;
}
