import { ASSESSMENT_CHANNELS, registerAssessmentHandlers } from './assessmentHandlers';
import { CHAT_CHANNELS, registerChatHandlers } from './chatHandlers';
import { RUBRIC_CHANNELS, registerRubricHandlers } from './rubricHandlers';
import type { IpcMainLike } from './types';
import { WORKSPACE_CHANNELS, registerWorkspaceHandlers } from './workspaceHandlers';

export const ALL_IPC_CHANNELS = [
  ...Object.values(WORKSPACE_CHANNELS),
  ...Object.values(ASSESSMENT_CHANNELS),
  ...Object.values(RUBRIC_CHANNELS),
  ...Object.values(CHAT_CHANNELS)
] as const;

export function registerIpcHandlers(ipcMain: IpcMainLike): readonly string[] {
  registerWorkspaceHandlers(ipcMain);
  registerAssessmentHandlers(ipcMain);
  registerRubricHandlers(ipcMain);
  registerChatHandlers(ipcMain);
  return ALL_IPC_CHANNELS;
}
