export interface ApiResultSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiResultFailure {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResult<T> = ApiResultSuccess<T> | ApiResultFailure;

export interface EssayLensApi {
  workspace: {
    selectFolder(): Promise<ApiResult<unknown>>;
    listFiles(folderId: string): Promise<ApiResult<unknown>>;
    getCurrentFolder(): Promise<ApiResult<unknown>>;
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
