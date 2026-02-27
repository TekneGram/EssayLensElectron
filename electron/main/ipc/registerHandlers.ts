import { ASSESSMENT_CHANNELS, registerAssessmentHandlers } from './assessmentHandlers';
import { CHAT_CHANNELS, registerChatHandlers } from './chatHandlers';
import { LLM_MANAGER_CHANNELS, registerLlmManagerHandlers } from './llmManagerHandlers';
import { LLM_SERVER_CHANNELS, registerLlmServerHandlers } from './llmServerHandlers';
import { LLM_SESSION_CHANNELS, registerLlmSessionHandlers } from './llmSessionHandlers';
import { RUBRIC_CHANNELS, registerRubricHandlers } from './rubricHandlers';
import type { IpcMainLike } from './types';
import { WORKSPACE_CHANNELS, registerWorkspaceHandlers } from './workspaceHandlers';

export const ALL_IPC_CHANNELS = [
  ...Object.values(WORKSPACE_CHANNELS),
  ...Object.values(ASSESSMENT_CHANNELS),
  ...Object.values(RUBRIC_CHANNELS),
  ...Object.values(CHAT_CHANNELS),
  ...Object.values(LLM_MANAGER_CHANNELS),
  ...Object.values(LLM_SERVER_CHANNELS),
  ...Object.values(LLM_SESSION_CHANNELS)
] as const;

export function registerIpcHandlers(ipcMain: IpcMainLike): readonly string[] {
  registerWorkspaceHandlers(ipcMain);
  registerAssessmentHandlers(ipcMain);
  registerRubricHandlers(ipcMain);
  registerChatHandlers(ipcMain);
  registerLlmManagerHandlers(ipcMain);
  registerLlmServerHandlers(ipcMain);
  registerLlmSessionHandlers(ipcMain);
  return ALL_IPC_CHANNELS;
}
