import { ASSESSMENT_CHANNELS, registerAssessmentHandlers } from './assessmentHandlers';
import { CHAT_CHANNELS, registerChatHandlers } from './chatHandlers';
import { LLM_MANAGER_CHANNELS, registerLlmManagerHandlers } from './llmManagerHandlers';
import { LLM_SERVER_CHANNELS, registerLlmServerHandlers } from './llmServerHandlers';
import { LLM_SESSION_CHANNELS, registerLlmSessionHandlers } from './llmSessionHandlers';
import { RUBRIC_CHANNELS, registerRubricHandlers } from './rubricHandlers';
import { LlmOrchestrator } from '../services/llmOrchestrator';
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

let sharedLlmOrchestrator: LlmOrchestrator | null = null;

function getSharedLlmOrchestrator(): LlmOrchestrator {
  if (!sharedLlmOrchestrator) {
    sharedLlmOrchestrator = new LlmOrchestrator();
  }
  return sharedLlmOrchestrator;
}

export async function shutdownSharedLlmRuntime(): Promise<void> {
  if (!sharedLlmOrchestrator) {
    return;
  }
  try {
    await sharedLlmOrchestrator.requestAction('llm.server.stop', {});
  } catch {
    // Ignore stop failures during app teardown.
  } finally {
    sharedLlmOrchestrator.shutdown();
    sharedLlmOrchestrator = null;
  }
}

export function registerIpcHandlers(ipcMain: IpcMainLike): readonly string[] {
  const llmOrchestrator = getSharedLlmOrchestrator();
  registerWorkspaceHandlers(ipcMain);
  registerAssessmentHandlers(ipcMain);
  registerRubricHandlers(ipcMain);
  registerChatHandlers(ipcMain, { llmOrchestrator });
  registerLlmManagerHandlers(ipcMain);
  registerLlmServerHandlers(ipcMain, { llmOrchestrator });
  registerLlmSessionHandlers(ipcMain, { llmOrchestrator });
  return ALL_IPC_CHANNELS;
}
