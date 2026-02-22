import { describe, expect, it, vi } from 'vitest';
import type { LlmRuntimeSettings } from '../../../shared/llmManagerContracts';
import { LLM_MANAGER_CHANNELS, registerLlmManagerHandlers } from '../llmManagerHandlers';

function createHarness() {
  const handle = vi.fn();
  return {
    handle,
    getHandler: (channel: string) => {
      const handler = handle.mock.calls.find(([registeredChannel]) => registeredChannel === channel)?.[1];
      expect(handler).toBeTypeOf('function');
      return handler as (event: unknown, payload?: unknown) => Promise<unknown>;
    }
  };
}

const settingsFixture: LlmRuntimeSettings = {
  llm_server_path: '/usr/local/bin/llama-server',
  llm_gguf_path: '/models/Qwen3-4B-Q8_0.gguf',
  llm_mmproj_path: null,
  llm_server_url: 'http://127.0.0.1:8080/v1/chat/completions',
  llm_host: '127.0.0.1',
  llm_port: 8080,
  llm_n_ctx: 4096,
  llm_n_threads: 8,
  llm_n_gpu_layers: 0,
  llm_n_batch: 512,
  llm_n_parallel: 1,
  llm_seed: null,
  llm_rope_freq_base: null,
  llm_rope_freq_scale: null,
  llm_use_jinja: true,
  llm_cache_prompt: true,
  llm_flash_attn: true,
  max_tokens: 1024,
  temperature: 0.2,
  top_p: 0.95,
  top_k: 50,
  repeat_penalty: 1.1,
  request_seed: null,
  use_fake_reply: false,
  fake_reply_text: null
};

describe('registerLlmManagerHandlers', () => {
  it('lists catalog, downloaded, active model, and settings', async () => {
    const harness = createHarness();
    const deps = {
      selectionRepository: {
        listCatalogModels: vi.fn().mockResolvedValue([{ key: 'qwen3_4b_q8', displayName: 'Qwen3 4B Q8_0' }]),
        listDownloadedModels: vi.fn().mockResolvedValue([
          {
            key: 'qwen3_4b_q8',
            displayName: 'Qwen3 4B Q8_0',
            localGgufPath: '/models/Qwen3-4B-Q8_0.gguf',
            localMmprojPath: null,
            downloadedAt: '2026-02-22T10:00:00.000Z',
            isActive: true
          }
        ]),
        getActiveModel: vi.fn().mockResolvedValue({
          key: 'qwen3_4b_q8',
          displayName: 'Qwen3 4B Q8_0',
          localGgufPath: '/models/Qwen3-4B-Q8_0.gguf',
          localMmprojPath: null,
          downloadedAt: '2026-02-22T10:00:00.000Z',
          isActive: true
        }),
        selectModel: vi.fn(),
        resetSettingsToDefaults: vi.fn(),
        upsertDownloadedModel: vi.fn()
      },
      settingsRepository: {
        getRuntimeSettings: vi.fn().mockResolvedValue(settingsFixture),
        updateRuntimeSettings: vi.fn()
      },
      downloadModel: vi.fn()
    };

    registerLlmManagerHandlers({ handle: harness.handle }, deps as never);

    const listCatalogHandler = harness.getHandler(LLM_MANAGER_CHANNELS.listCatalogModels);
    const listDownloadedHandler = harness.getHandler(LLM_MANAGER_CHANNELS.listDownloadedModels);
    const getActiveHandler = harness.getHandler(LLM_MANAGER_CHANNELS.getActiveModel);
    const getSettingsHandler = harness.getHandler(LLM_MANAGER_CHANNELS.getSettings);

    await expect(listCatalogHandler({}, undefined)).resolves.toEqual({
      ok: true,
      data: { models: [{ key: 'qwen3_4b_q8', displayName: 'Qwen3 4B Q8_0' }] }
    });
    await expect(listDownloadedHandler({}, undefined)).resolves.toMatchObject({
      ok: true,
      data: { models: [{ key: 'qwen3_4b_q8', isActive: true }] }
    });
    await expect(getActiveHandler({}, undefined)).resolves.toMatchObject({
      ok: true,
      data: { model: { key: 'qwen3_4b_q8', isActive: true } }
    });
    await expect(getSettingsHandler({}, undefined)).resolves.toEqual({
      ok: true,
      data: { settings: settingsFixture }
    });
  });

  it('selects model and returns active model + copied settings', async () => {
    const harness = createHarness();
    const selectModel = vi.fn().mockResolvedValue({
      activeModel: {
        key: 'qwen3_8b_q8',
        displayName: 'Qwen3 8B Q8_0',
        localGgufPath: '/models/Qwen3-8B-Q8_0.gguf',
        localMmprojPath: null,
        downloadedAt: '2026-02-22T11:00:00.000Z',
        isActive: true
      },
      settings: { ...settingsFixture, llm_gguf_path: '/models/Qwen3-8B-Q8_0.gguf', llm_n_ctx: 8192, temperature: 0.15 }
    });
    registerLlmManagerHandlers(
      { handle: harness.handle },
      {
        selectionRepository: {
          listCatalogModels: vi.fn(),
          listDownloadedModels: vi.fn(),
          getActiveModel: vi.fn(),
          selectModel,
          resetSettingsToDefaults: vi.fn(),
          upsertDownloadedModel: vi.fn()
        } as never,
        settingsRepository: {
          getRuntimeSettings: vi.fn(),
          updateRuntimeSettings: vi.fn()
        } as never,
        downloadModel: vi.fn()
      }
    );

    const handler = harness.getHandler(LLM_MANAGER_CHANNELS.selectModel);
    const result = await handler({}, { key: 'qwen3_8b_q8' });
    expect(selectModel).toHaveBeenCalledWith('qwen3_8b_q8');
    expect(result).toMatchObject({
      ok: true,
      data: {
        activeModel: { key: 'qwen3_8b_q8', isActive: true },
        settings: { llm_gguf_path: '/models/Qwen3-8B-Q8_0.gguf', llm_n_ctx: 8192, temperature: 0.15 }
      }
    });
  });

  it('validates select payloads and downloaded model requirement', async () => {
    const harness = createHarness();
    const selectModel = vi.fn().mockResolvedValue(null);
    registerLlmManagerHandlers(
      { handle: harness.handle },
      {
        selectionRepository: {
          listCatalogModels: vi.fn(),
          listDownloadedModels: vi.fn(),
          getActiveModel: vi.fn(),
          selectModel,
          resetSettingsToDefaults: vi.fn(),
          upsertDownloadedModel: vi.fn()
        } as never,
        settingsRepository: {
          getRuntimeSettings: vi.fn(),
          updateRuntimeSettings: vi.fn()
        } as never,
        downloadModel: vi.fn()
      }
    );

    const handler = harness.getHandler(LLM_MANAGER_CHANNELS.selectModel);

    await expect(handler({}, { key: 'unknown' })).resolves.toEqual({
      ok: false,
      error: {
        code: 'LLM_MANAGER_SELECT_INVALID_PAYLOAD',
        message: 'Select model payload must include a supported model key.'
      }
    });
    await expect(handler({}, { key: 'qwen3_4b_q8' })).resolves.toEqual({
      ok: false,
      error: {
        code: 'LLM_MANAGER_SELECT_MODEL_NOT_DOWNLOADED',
        message: 'The selected model is not downloaded and cannot be activated.'
      }
    });
    expect(selectModel).toHaveBeenCalledTimes(1);
  });

  it('updates settings only via llm_settings payload and supports reset to defaults', async () => {
    const harness = createHarness();
    const updateRuntimeSettings = vi.fn().mockResolvedValue({ ...settingsFixture, llm_n_ctx: 2048, temperature: 0.7 });
    const resetSettingsToDefaults = vi.fn().mockResolvedValue({
      activeModel: {
        key: 'qwen3_4b_q8',
        displayName: 'Qwen3 4B Q8_0',
        localGgufPath: '/models/Qwen3-4B-Q8_0.gguf',
        localMmprojPath: null,
        downloadedAt: '2026-02-22T10:00:00.000Z',
        isActive: true
      },
      settings: settingsFixture
    });
    registerLlmManagerHandlers(
      { handle: harness.handle },
      {
        selectionRepository: {
          listCatalogModels: vi.fn(),
          listDownloadedModels: vi.fn(),
          getActiveModel: vi.fn(),
          selectModel: vi.fn(),
          resetSettingsToDefaults,
          upsertDownloadedModel: vi.fn()
        } as never,
        settingsRepository: {
          getRuntimeSettings: vi.fn(),
          updateRuntimeSettings
        } as never,
        downloadModel: vi.fn()
      }
    );

    const updateHandler = harness.getHandler(LLM_MANAGER_CHANNELS.updateSettings);
    const resetHandler = harness.getHandler(LLM_MANAGER_CHANNELS.resetSettingsToDefaults);

    await expect(
      updateHandler({}, { settings: { llm_n_ctx: 2048, temperature: 0.7, llm_flash_attn: false, fake_reply_text: null } })
    ).resolves.toEqual({
      ok: true,
      data: { settings: { ...settingsFixture, llm_n_ctx: 2048, temperature: 0.7 } }
    });
    expect(updateRuntimeSettings).toHaveBeenCalledWith({
      llm_n_ctx: 2048,
      temperature: 0.7,
      llm_flash_attn: false,
      fake_reply_text: null
    });

    await expect(updateHandler({}, { settings: { llm_n_ctx: '2048' } })).resolves.toEqual({
      ok: false,
      error: {
        code: 'LLM_MANAGER_UPDATE_SETTINGS_INVALID_PAYLOAD',
        message: 'Update settings payload must include a valid settings object.'
      }
    });

    await expect(updateHandler({}, { settings: { unknown_field: 1 } })).resolves.toEqual({
      ok: false,
      error: {
        code: 'LLM_MANAGER_UPDATE_SETTINGS_INVALID_PAYLOAD',
        message: 'Update settings payload must include a valid settings object.'
      }
    });

    await expect(resetHandler({}, undefined)).resolves.toEqual({
      ok: true,
      data: {
        activeModel: {
          key: 'qwen3_4b_q8',
          displayName: 'Qwen3 4B Q8_0',
          localGgufPath: '/models/Qwen3-4B-Q8_0.gguf',
          localMmprojPath: null,
          downloadedAt: '2026-02-22T10:00:00.000Z',
          isActive: true
        },
        settings: settingsFixture
      }
    });

    resetSettingsToDefaults.mockResolvedValueOnce(null);
    await expect(resetHandler({}, undefined)).resolves.toEqual({
      ok: false,
      error: {
        code: 'LLM_MANAGER_RESET_NO_ACTIVE_MODEL',
        message: 'No active model is selected to reset settings from defaults.'
      }
    });
  });

  it('downloads a catalog model and persists it as downloaded', async () => {
    const harness = createHarness();
    const downloadModel = vi.fn().mockResolvedValue('/Users/test/AppData/EssayLens/models/qwen3_4b_q8/Qwen3-4B-Q8_0.gguf');
    const upsertDownloadedModel = vi.fn().mockResolvedValue({
      key: 'qwen3_4b_q8',
      displayName: 'Qwen3 4B Q8_0',
      localGgufPath: '/Users/test/AppData/EssayLens/models/qwen3_4b_q8/Qwen3-4B-Q8_0.gguf',
      localMmprojPath: null,
      downloadedAt: '2026-02-22T12:00:00.000Z',
      isActive: false
    });

    registerLlmManagerHandlers(
      { handle: harness.handle },
      {
        selectionRepository: {
          listCatalogModels: vi.fn().mockResolvedValue([
            {
              key: 'qwen3_4b_q8',
              displayName: 'Qwen3 4B Q8_0',
              hfRepoId: 'Qwen/Qwen3-4B-GGUF',
              hfFilename: 'Qwen3-4B-Q8_0.gguf',
              mmprojFilename: null,
              backend: 'server',
              modelFamily: 'instruct/think'
            }
          ]),
          listDownloadedModels: vi.fn(),
          getActiveModel: vi.fn(),
          selectModel: vi.fn(),
          resetSettingsToDefaults: vi.fn(),
          upsertDownloadedModel
        } as never,
        settingsRepository: {
          getRuntimeSettings: vi.fn(),
          updateRuntimeSettings: vi.fn()
        } as never,
        downloadModel
      }
    );

    const send = vi.fn();
    const handler = harness.getHandler(LLM_MANAGER_CHANNELS.downloadModel);
    await expect(handler({ sender: { send } }, { key: 'qwen3_4b_q8' })).resolves.toEqual({
      ok: true,
      data: {
        model: {
          key: 'qwen3_4b_q8',
          displayName: 'Qwen3 4B Q8_0',
          localGgufPath: '/Users/test/AppData/EssayLens/models/qwen3_4b_q8/Qwen3-4B-Q8_0.gguf',
          localMmprojPath: null,
          downloadedAt: '2026-02-22T12:00:00.000Z',
          isActive: false
        }
      }
    });

    expect(downloadModel).toHaveBeenCalledWith({
      key: 'qwen3_4b_q8',
      hfRepoId: 'Qwen/Qwen3-4B-GGUF',
      hfFilename: 'Qwen3-4B-Q8_0.gguf',
      onProgress: expect.any(Function)
    });
    expect(upsertDownloadedModel).toHaveBeenCalledWith({
      key: 'qwen3_4b_q8',
      displayName: 'Qwen3 4B Q8_0',
      localGgufPath: '/Users/test/AppData/EssayLens/models/qwen3_4b_q8/Qwen3-4B-Q8_0.gguf',
      localMmprojPath: null
    });
    expect(send).toHaveBeenCalledWith(
      'llmManager/downloadProgress',
      expect.objectContaining({ key: 'qwen3_4b_q8', phase: 'persisting' })
    );
    expect(send).toHaveBeenCalledWith(
      'llmManager/downloadProgress',
      expect.objectContaining({ key: 'qwen3_4b_q8', phase: 'completed', percent: 100 })
    );
  });

  it('rejects invalid download payload and unknown catalog entries', async () => {
    const harness = createHarness();
    const downloadModel = vi.fn();
    registerLlmManagerHandlers(
      { handle: harness.handle },
      {
        selectionRepository: {
          listCatalogModels: vi.fn().mockResolvedValue([]),
          listDownloadedModels: vi.fn(),
          getActiveModel: vi.fn(),
          selectModel: vi.fn(),
          resetSettingsToDefaults: vi.fn(),
          upsertDownloadedModel: vi.fn()
        } as never,
        settingsRepository: {
          getRuntimeSettings: vi.fn(),
          updateRuntimeSettings: vi.fn()
        } as never,
        downloadModel
      }
    );

    const handler = harness.getHandler(LLM_MANAGER_CHANNELS.downloadModel);
    await expect(handler({}, { key: 'bad_key' })).resolves.toEqual({
      ok: false,
      error: {
        code: 'LLM_MANAGER_DOWNLOAD_INVALID_PAYLOAD',
        message: 'Download model payload must include a supported model key.'
      }
    });
    await expect(handler({}, { key: 'qwen3_8b_q8' })).resolves.toEqual({
      ok: false,
      error: {
        code: 'LLM_MANAGER_DOWNLOAD_MODEL_NOT_FOUND',
        message: 'The requested model key does not exist in the LLM catalog.'
      }
    });
    expect(downloadModel).not.toHaveBeenCalled();
  });

  it('maps download failures and persistence failures separately', async () => {
    const harness = createHarness();
    const upsertDownloadedModel = vi.fn().mockRejectedValue(new Error('sqlite write failed'));
    const downloadModel = vi
      .fn()
      .mockRejectedValueOnce(new Error('network timeout'))
      .mockResolvedValueOnce('/Users/test/AppData/EssayLens/models/qwen3_8b_q8/Qwen3-8B-Q8_0.gguf');

    registerLlmManagerHandlers(
      { handle: harness.handle },
      {
        selectionRepository: {
          listCatalogModels: vi.fn().mockResolvedValue([
            {
              key: 'qwen3_8b_q8',
              displayName: 'Qwen3 8B Q8_0',
              hfRepoId: 'Qwen/Qwen3-8B-GGUF',
              hfFilename: 'Qwen3-8B-Q8_0.gguf',
              mmprojFilename: null,
              backend: 'server',
              modelFamily: 'instruct/think'
            }
          ]),
          listDownloadedModels: vi.fn(),
          getActiveModel: vi.fn(),
          selectModel: vi.fn(),
          resetSettingsToDefaults: vi.fn(),
          upsertDownloadedModel
        } as never,
        settingsRepository: {
          getRuntimeSettings: vi.fn(),
          updateRuntimeSettings: vi.fn()
        } as never,
        downloadModel
      }
    );

    const send = vi.fn();
    const handler = harness.getHandler(LLM_MANAGER_CHANNELS.downloadModel);
    await expect(handler({ sender: { send } }, { key: 'qwen3_8b_q8' })).resolves.toMatchObject({
      ok: false,
      error: {
        code: 'LLM_MANAGER_DOWNLOAD_FAILED',
        message: 'Could not download the selected LLM model.'
      }
    });
    await expect(handler({ sender: { send } }, { key: 'qwen3_8b_q8' })).resolves.toMatchObject({
      ok: false,
      error: {
        code: 'LLM_MANAGER_DOWNLOAD_PERSIST_FAILED',
        message: 'Model download succeeded but could not be persisted.'
      }
    });
    expect(send).toHaveBeenCalledWith(
      'llmManager/downloadProgress',
      expect.objectContaining({ key: 'qwen3_8b_q8', phase: 'failed' })
    );
  });
});
