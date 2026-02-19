import type { IpcRendererEvent } from 'electron';
import type { ApiResult, EssayLensApi } from './apiTypes';
import type {
  ApplyFeedbackRequest,
  AddFeedbackRequest,
  DeleteFeedbackRequest,
  EditFeedbackRequest,
  ExtractDocumentRequest,
  ListFeedbackRequest,
  RequestLlmAssessmentRequest,
  SendFeedbackToLlmRequest
} from '../shared/assessmentContracts';
import type { SendChatMessageRequest } from '../shared/chatContracts';

type IpcRendererLike = {
  invoke<TResult = unknown>(channel: string, request?: unknown): Promise<TResult>;
  on(channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void): void;
};

type ContextBridgeLike = {
  exposeInMainWorld(key: string, api: unknown): void;
};

export function createPreloadApi(ipcRenderer: IpcRendererLike): EssayLensApi {
  const invokeApi = <T>(channel: string, request?: unknown): Promise<ApiResult<T>> =>
    ipcRenderer.invoke<ApiResult<T>>(channel, request);

  return {
    workspace: {
      selectFolder: () => invokeApi('workspace/selectFolder'),
      listFiles: (folderId: string) => invokeApi('workspace/listFiles', { folderId }),
      getCurrentFolder: () => invokeApi('workspace/getCurrentFolder')
    },
    assessment: {
      extractDocument: (request: ExtractDocumentRequest) => invokeApi('assessment/extractDocument', request),
      listFeedback: (request: ListFeedbackRequest) => invokeApi('assessment/listFeedback', request),
      addFeedback: (request: AddFeedbackRequest) => invokeApi('assessment/addFeedback', request),
      editFeedback: (request: EditFeedbackRequest) => invokeApi('assessment/editFeedback', request),
      deleteFeedback: (request: DeleteFeedbackRequest) => invokeApi('assessment/deleteFeedback', request),
      applyFeedback: (request: ApplyFeedbackRequest) => invokeApi('assessment/applyFeedback', request),
      sendFeedbackToLlm: (request: SendFeedbackToLlmRequest) => invokeApi('assessment/sendFeedbackToLlm', request),
      requestLlmAssessment: (request: RequestLlmAssessmentRequest) => invokeApi('assessment/requestLlmAssessment', request)
    },
    rubric: {
      listRubrics: () => invokeApi('rubric/listRubrics'),
      getMatrix: (rubricId: string) => invokeApi('rubric/getMatrix', { rubricId }),
      updateMatrix: (request: unknown) => invokeApi('rubric/updateMatrix', request)
    },
    chat: {
      listMessages: (fileId?: string) => invokeApi('chat/listMessages', { fileId }),
      sendMessage: (request: SendChatMessageRequest) => invokeApi('chat/sendMessage', request)
    }
  };
}

export function registerPreloadApi(contextBridgeArg?: ContextBridgeLike, ipcRendererArg?: IpcRendererLike): void {
  let contextBridge = contextBridgeArg;
  let ipcRenderer = ipcRendererArg;
  if (!contextBridge || !ipcRenderer) {
    const electron = require('electron') as typeof import('electron');
    contextBridge = contextBridge ?? electron.contextBridge;
    ipcRenderer = ipcRenderer ?? electron.ipcRenderer;
  }
  if (!contextBridge || !ipcRenderer) {
    throw new Error('Preload dependencies are not available.');
  }

  const api = createPreloadApi(ipcRenderer);
  contextBridge.exposeInMainWorld('api', api);
}

if (!process.env.VITEST) {
  registerPreloadApi();
}
