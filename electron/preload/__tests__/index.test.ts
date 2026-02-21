import { describe, expect, it, vi } from 'vitest';
import { createPreloadApi, registerPreloadApi } from '../index';

describe('preload api', () => {
  it('exposes typed api surface to window', async () => {
    const invoke = vi.fn().mockResolvedValue({ ok: true, data: {} });
    const exposeInMainWorld = vi.fn();

    registerPreloadApi({ exposeInMainWorld }, { invoke, on: vi.fn() });

    expect(exposeInMainWorld).toHaveBeenCalledTimes(1);
    expect(exposeInMainWorld.mock.calls[0][0]).toBe('api');

    const api = exposeInMainWorld.mock.calls[0][1] as ReturnType<typeof createPreloadApi>;
    expect(api.workspace).toBeDefined();
    expect(api.assessment).toBeDefined();
    expect(api.rubric).toBeDefined();
    expect(api.chat).toBeDefined();

    await api.workspace.selectFolder();
    await api.assessment.extractDocument({ fileId: 'file-1' });
    await api.assessment.editFeedback({ feedbackId: 'fb-1', commentText: 'Updated.' });
    await api.assessment.deleteFeedback({ feedbackId: 'fb-1' });
    await api.assessment.applyFeedback({ feedbackId: 'fb-1', applied: true });
    await api.assessment.sendFeedbackToLlm({ feedbackId: 'fb-1', command: 'evaluate-thesis' });
    await api.assessment.generateFeedbackDocument({ fileId: 'file-1' });
    await api.rubric.listRubrics();
    await api.rubric.createRubric({ name: 'New Rubric' });
    await api.rubric.cloneRubric({ rubricId: 'rubric-1' });
    await api.rubric.deleteRubric({ rubricId: 'rubric-2' });
    await api.rubric.getFileScores({ fileId: 'file-1', rubricId: 'rubric-1' });
    await api.rubric.saveFileScores({
      fileId: 'file-1',
      rubricId: 'rubric-1',
      selections: [{ rubricDetailId: 'detail-1', assignedScore: '4' }]
    });
    await api.rubric.clearAppliedRubric({ fileId: 'file-1', rubricId: 'rubric-1' });
    await api.rubric.getGradingContext({ fileId: 'file-1' });
    await api.rubric.setLastUsed({ rubricId: 'rubric-1' });
    await api.chat.sendMessage({ message: 'hello' });

    expect(invoke).toHaveBeenCalledWith('workspace/selectFolder', undefined);
    expect(invoke).toHaveBeenCalledWith('assessment/extractDocument', { fileId: 'file-1' });
    expect(invoke).toHaveBeenCalledWith('assessment/editFeedback', { feedbackId: 'fb-1', commentText: 'Updated.' });
    expect(invoke).toHaveBeenCalledWith('assessment/deleteFeedback', { feedbackId: 'fb-1' });
    expect(invoke).toHaveBeenCalledWith('assessment/applyFeedback', { feedbackId: 'fb-1', applied: true });
    expect(invoke).toHaveBeenCalledWith('assessment/sendFeedbackToLlm', {
      feedbackId: 'fb-1',
      command: 'evaluate-thesis'
    });
    expect(invoke).toHaveBeenCalledWith('assessment/generateFeedbackDocument', { fileId: 'file-1' });
    expect(invoke).toHaveBeenCalledWith('rubric/listRubrics', undefined);
    expect(invoke).toHaveBeenCalledWith('rubric/createRubric', { name: 'New Rubric' });
    expect(invoke).toHaveBeenCalledWith('rubric/cloneRubric', { rubricId: 'rubric-1' });
    expect(invoke).toHaveBeenCalledWith('rubric/deleteRubric', { rubricId: 'rubric-2' });
    expect(invoke).toHaveBeenCalledWith('rubric/getFileScores', { fileId: 'file-1', rubricId: 'rubric-1' });
    expect(invoke).toHaveBeenCalledWith('rubric/saveFileScores', {
      fileId: 'file-1',
      rubricId: 'rubric-1',
      selections: [{ rubricDetailId: 'detail-1', assignedScore: '4' }]
    });
    expect(invoke).toHaveBeenCalledWith('rubric/clearAppliedRubric', { fileId: 'file-1', rubricId: 'rubric-1' });
    expect(invoke).toHaveBeenCalledWith('rubric/getGradingContext', { fileId: 'file-1' });
    expect(invoke).toHaveBeenCalledWith('rubric/setLastUsed', { rubricId: 'rubric-1' });
    expect(invoke).toHaveBeenCalledWith('chat/sendMessage', { message: 'hello' });
  });
});
