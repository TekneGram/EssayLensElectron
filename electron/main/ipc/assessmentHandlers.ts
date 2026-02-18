import { notImplementedResult } from './result';
import type { IpcMainLike } from './types';

export const ASSESSMENT_CHANNELS = {
  extractDocument: 'assessment/extractDocument',
  listFeedback: 'assessment/listFeedback',
  addFeedback: 'assessment/addFeedback',
  requestLlmAssessment: 'assessment/requestLlmAssessment'
} as const;

export function registerAssessmentHandlers(ipcMain: IpcMainLike): void {
  ipcMain.handle(ASSESSMENT_CHANNELS.extractDocument, async () =>
    notImplementedResult('assessment.extractDocument')
  );
  ipcMain.handle(ASSESSMENT_CHANNELS.listFeedback, async () =>
    notImplementedResult('assessment.listFeedback')
  );
  ipcMain.handle(ASSESSMENT_CHANNELS.addFeedback, async () =>
    notImplementedResult('assessment.addFeedback')
  );
  ipcMain.handle(ASSESSMENT_CHANNELS.requestLlmAssessment, async () =>
    notImplementedResult('assessment.requestLlmAssessment')
  );
}
