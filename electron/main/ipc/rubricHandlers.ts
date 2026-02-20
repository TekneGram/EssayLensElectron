import { notImplementedResult } from './result';
import type { IpcMainLike } from './types';

export const RUBRIC_CHANNELS = {
  listRubrics: 'rubric/listRubrics',
  getMatrix: 'rubric/getMatrix',
  updateMatrix: 'rubric/updateMatrix'
} as const;

export function registerRubricHandlers(ipcMain: IpcMainLike): void {
  ipcMain.handle(RUBRIC_CHANNELS.listRubrics, async () =>
    notImplementedResult('rubric.listRubrics')
  );
  ipcMain.handle(RUBRIC_CHANNELS.getMatrix, async (_event, _request) => notImplementedResult('rubric.getMatrix'));
  ipcMain.handle(RUBRIC_CHANNELS.updateMatrix, async (_event, _request) =>
    notImplementedResult('rubric.updateMatrix')
  );
}
