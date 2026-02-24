import { describe, expect, it, vi } from 'vitest';
import { createPreloadApi, registerPreloadApi } from '../index';

describe('preload api', () => {
  it('exposes typed api surface to window', async () => {
    const invoke = vi.fn().mockResolvedValue({ ok: true, data: {} });
    const listeners = new Map<string, (event: unknown, ...args: unknown[]) => void>();
    const on = vi.fn((channel: string, listener: (event: unknown, ...args: unknown[]) => void) => {
      listeners.set(channel, listener);
    });
    const removeListener = vi.fn((channel: string) => {
      listeners.delete(channel);
    });
    const exposeInMainWorld = vi.fn();

    registerPreloadApi({ exposeInMainWorld }, { invoke, on, removeListener });

    expect(exposeInMainWorld).toHaveBeenCalledTimes(1);
    expect(exposeInMainWorld.mock.calls[0][0]).toBe('api');

    const api = exposeInMainWorld.mock.calls[0][1] as ReturnType<typeof createPreloadApi>;
    expect(api.workspace).toBeDefined();
    expect(api.assessment).toBeDefined();
    expect(api.rubric).toBeDefined();
    expect(api.chat).toBeDefined();
    expect(api.llmManager).toBeDefined();

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
    const streamListener = vi.fn();
    const unsubscribeStream = api.chat.onStreamChunk(streamListener);
    await api.llmManager.listCatalogModels();
    await api.llmManager.listDownloadedModels();
    await api.llmManager.getActiveModel();
    await api.llmManager.downloadModel({ key: 'qwen3_8b_q8' });
    await api.llmManager.deleteDownloadedModel({ key: 'qwen3_8b_q8', deleteFiles: true });
    await api.llmManager.selectModel({ key: 'qwen3_4b_q8' });
    await api.llmManager.getSettings();
    await api.llmManager.updateSettings({ settings: { llm_n_ctx: 4096, temperature: 0.2 } });
    await api.llmManager.resetSettingsToDefaults();
    const progressListener = vi.fn();
    const unsubscribe = api.llmManager.onDownloadProgress(progressListener);
    listeners.get('llmManager/downloadProgress')?.({}, { key: 'qwen3_8b_q8', phase: 'downloading' });
    listeners.get('chat/streamChunk')?.(
      {},
      {
        requestId: 'req-1',
        clientRequestId: 'client-1',
        type: 'chunk',
        seq: 2,
        channel: 'content',
        text: 'hello'
      }
    );
    unsubscribe();
    unsubscribeStream();

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
    expect(invoke).toHaveBeenCalledWith('llmManager/listCatalogModels', undefined);
    expect(invoke).toHaveBeenCalledWith('llmManager/listDownloadedModels', undefined);
    expect(invoke).toHaveBeenCalledWith('llmManager/getActiveModel', undefined);
    expect(invoke).toHaveBeenCalledWith('llmManager/downloadModel', { key: 'qwen3_8b_q8' });
    expect(invoke).toHaveBeenCalledWith('llmManager/deleteDownloadedModel', { key: 'qwen3_8b_q8', deleteFiles: true });
    expect(invoke).toHaveBeenCalledWith('llmManager/selectModel', { key: 'qwen3_4b_q8' });
    expect(invoke).toHaveBeenCalledWith('llmManager/getSettings', undefined);
    expect(invoke).toHaveBeenCalledWith('llmManager/updateSettings', {
      settings: { llm_n_ctx: 4096, temperature: 0.2 }
    });
    expect(invoke).toHaveBeenCalledWith('llmManager/resetSettingsToDefaults', undefined);
    expect(progressListener).toHaveBeenCalledWith({ key: 'qwen3_8b_q8', phase: 'downloading' });
    expect(streamListener).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'req-1',
        clientRequestId: 'client-1',
        type: 'chunk',
        text: 'hello'
      })
    );
    expect(on).toHaveBeenCalledWith('chat/streamChunk', expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith('chat/streamChunk', expect.any(Function));
    expect(on).toHaveBeenCalledWith('llmManager/downloadProgress', expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith('llmManager/downloadProgress', expect.any(Function));
  });
});
