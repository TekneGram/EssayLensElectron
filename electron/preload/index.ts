import type { IpcRendererEvent } from 'electron';
import type { ApiResult, EssayLensApi } from './apiTypes';
import type { SendChatMessagePayload } from '../shared/chatContracts';

type IpcRendererLike = {
  invoke<TResult = unknown>(channel: string, payload?: unknown): Promise<TResult>;
  on(channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void): void;
};

type ContextBridgeLike = {
  exposeInMainWorld(key: string, api: unknown): void;
};

export function createPreloadApi(ipcRenderer: IpcRendererLike): EssayLensApi {
  const invokeResult = <T>(channel: string, payload?: unknown): Promise<ApiResult<T>> =>
    ipcRenderer.invoke<ApiResult<T>>(channel, payload);

  return {
    workspace: {
      selectFolder: () => invokeResult('workspace/selectFolder'),
      listFiles: (folderId: string) => invokeResult('workspace/listFiles', { folderId }),
      getCurrentFolder: () => invokeResult('workspace/getCurrentFolder')
    },
    assessment: {
      extractDocument: (fileId: string) => invokeResult('assessment/extractDocument', { fileId }),
      listFeedback: (fileId: string) => invokeResult('assessment/listFeedback', { fileId }),
      addFeedback: (payload: unknown) => invokeResult('assessment/addFeedback', payload),
      requestLlmAssessment: (payload: unknown) => invokeResult('assessment/requestLlmAssessment', payload)
    },
    rubric: {
      listRubrics: () => invokeResult('rubric/listRubrics'),
      getMatrix: (rubricId: string) => invokeResult('rubric/getMatrix', { rubricId }),
      updateMatrix: (payload: unknown) => invokeResult('rubric/updateMatrix', payload)
    },
    chat: {
      listMessages: (fileId?: string) => invokeResult('chat/listMessages', { fileId }),
      sendMessage: (payload: SendChatMessagePayload) => invokeResult('chat/sendMessage', payload)
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
