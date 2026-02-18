import { notImplementedResult } from './result';
import type { IpcMainLike } from './types';

export const CHAT_CHANNELS = {
  listMessages: 'chat/listMessages',
  sendMessage: 'chat/sendMessage'
} as const;

export function registerChatHandlers(ipcMain: IpcMainLike): void {
  ipcMain.handle(CHAT_CHANNELS.listMessages, async () =>
    notImplementedResult('chat.listMessages')
  );
  ipcMain.handle(CHAT_CHANNELS.sendMessage, async () =>
    notImplementedResult('chat.sendMessage')
  );
}
