import type { EssayLensApi } from '../../../../electron/preload/apiTypes';
import type { ChatPort } from '../../ports';

function getElectronChatApi(): EssayLensApi['chat'] {
  const appWindow = window as Window & { api?: { chat?: EssayLensApi['chat'] } };
  if (!appWindow.api?.chat) {
    throw new Error('window.api.chat is not available.');
  }

  return appWindow.api.chat;
}

export function createElectronChatAdapter(): ChatPort {
  return {
    listMessages: (fileId) => getElectronChatApi().listMessages(fileId),
    sendMessage: (request) => getElectronChatApi().sendMessage(request),
    onStreamChunk: (listener) => {
      const chatApi = getElectronChatApi() as EssayLensApi['chat'] & {
        onStreamChunk?: (eventListener: (event: Parameters<typeof listener>[0]) => void) => () => void;
      };
      if (typeof chatApi.onStreamChunk !== 'function') {
        return () => {};
      }

      return chatApi.onStreamChunk(listener);
    }
  };
}
