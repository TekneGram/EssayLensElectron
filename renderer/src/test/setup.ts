import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

beforeEach(() => {
  if (typeof window === 'undefined') {
    return;
  }

  const appWindow = window as Window & { api?: Record<string, unknown> };
  appWindow.api ??= {};

  const existingLlmManager = (appWindow.api.llmManager as Record<string, unknown> | undefined) ?? {};

  appWindow.api.llmManager = {
    listCatalogModels: vi.fn().mockResolvedValue({ ok: true, data: { models: [] } }),
    listDownloadedModels: vi.fn().mockResolvedValue({ ok: true, data: { models: [] } }),
    getActiveModel: vi.fn().mockResolvedValue({ ok: true, data: { model: null } }),
    selectModel: vi.fn().mockResolvedValue({ ok: true, data: { model: null } }),
    getSettings: vi.fn().mockResolvedValue({
      ok: true,
      data: { settings: { llm_n_ctx: 4096, llm_n_predict: 1024, llm_top_k: 40, llm_top_p: 0.95, temperature: 0.2 } }
    }),
    updateSettings: vi.fn().mockResolvedValue({
      ok: true,
      data: { settings: { llm_n_ctx: 4096, llm_n_predict: 1024, llm_top_k: 40, llm_top_p: 0.95, temperature: 0.2 } }
    }),
    resetSettingsToDefaults: vi.fn().mockResolvedValue({
      ok: true,
      data: { settings: { llm_n_ctx: 4096, llm_n_predict: 1024, llm_top_k: 40, llm_top_p: 0.95, temperature: 0.2 } }
    }),
    downloadModel: vi.fn().mockResolvedValue({
      ok: true,
      data: { model: { key: 'qwen3_4b_q8', status: 'downloaded' } }
    }),
    deleteDownloadedModel: vi.fn().mockResolvedValue({ ok: true, data: { key: 'qwen3_4b_q8', deleted: true } }),
    onDownloadProgress: vi.fn().mockReturnValue(() => {}),
    ...existingLlmManager
  };
});

afterEach(() => {
  cleanup();
});
