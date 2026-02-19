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
    await api.rubric.listRubrics();
    await api.chat.sendMessage({ message: 'hello' });

    expect(invoke).toHaveBeenCalledWith('workspace/selectFolder', undefined);
    expect(invoke).toHaveBeenCalledWith('assessment/extractDocument', { fileId: 'file-1' });
    expect(invoke).toHaveBeenCalledWith('rubric/listRubrics', undefined);
    expect(invoke).toHaveBeenCalledWith('chat/sendMessage', { message: 'hello' });
  });
});
