import { describe, expect, it } from 'vitest';
import { SQLiteClient } from '../../sqlite';
import { LlmSelectionRepository } from '../llmSelectionRepository';
import { LlmSettingsRepository } from '../llmSettingsRepository';

describe('LlmSelectionRepository', () => {
  it('lists seeded catalog and starts with no downloaded model', async () => {
    const db = new SQLiteClient({ dbPath: ':memory:' });
    const repository = new LlmSelectionRepository({ db });

    const catalog = await repository.listCatalogModels();
    expect(catalog).toHaveLength(2);
    expect(catalog.map((model) => model.key)).toEqual(['qwen3_4b_q8', 'qwen3_8b_q8']);
    expect(catalog.map((model) => model.displayName)).toEqual(['Qwen3 4B Q8_0', 'Qwen3 8B Q8_0']);

    const downloaded = await repository.listDownloadedModels();
    expect(downloaded).toEqual([]);
    expect(await repository.getActiveModel()).toBeNull();
  });

  it('selects a downloaded model and copies defaults into llm_settings', async () => {
    const db = new SQLiteClient({ dbPath: ':memory:' });
    const repository = new LlmSelectionRepository({ db, now: () => '2026-02-22T10:00:00.000Z' });
    const settingsRepository = new LlmSettingsRepository(db);

    await repository.upsertDownloadedModel({
      key: 'qwen3_4b_q8',
      displayName: 'Qwen3 4B Q8_0',
      localGgufPath: '/models/Qwen3-4B-Q8_0.gguf'
    });
    await repository.upsertDownloadedModel({
      key: 'qwen3_8b_q8',
      displayName: 'Qwen3 8B Q8_0',
      localGgufPath: '/models/Qwen3-8B-Q8_0.gguf'
    });

    const selected = await repository.selectModel('qwen3_8b_q8');
    expect(selected?.activeModel.key).toBe('qwen3_8b_q8');
    expect(selected?.activeModel.isActive).toBe(true);

    const active = await repository.getActiveModel();
    expect(active?.key).toBe('qwen3_8b_q8');
    expect(active?.localGgufPath).toBe('/models/Qwen3-8B-Q8_0.gguf');

    const settings = await settingsRepository.getRuntimeSettings();
    expect(settings.llm_n_ctx).toBe(8192);
    expect(settings.temperature).toBe(0.15);
    expect(settings.top_k).toBe(50);
    expect(settings.llm_gguf_path).toBe('/models/Qwen3-8B-Q8_0.gguf');
  });

  it('resets mutable runtime settings from active model defaults', async () => {
    const db = new SQLiteClient({ dbPath: ':memory:' });
    const repository = new LlmSelectionRepository({ db, now: () => '2026-02-22T10:00:00.000Z' });
    const settingsRepository = new LlmSettingsRepository(db);

    await repository.upsertDownloadedModel({
      key: 'qwen3_4b_q8',
      displayName: 'Qwen3 4B Q8_0',
      localGgufPath: '/models/Qwen3-4B-Q8_0.gguf'
    });
    await repository.selectModel('qwen3_4b_q8');

    await settingsRepository.updateRuntimeSettings({
      llm_n_ctx: 2048,
      temperature: 0.73,
      llm_flash_attn: false,
      llm_gguf_path: '/models/custom.gguf'
    });

    const updated = await settingsRepository.getRuntimeSettings();
    expect(updated.llm_n_ctx).toBe(2048);
    expect(updated.temperature).toBe(0.73);
    expect(updated.llm_flash_attn).toBe(false);
    expect(updated.llm_gguf_path).toBe('/models/custom.gguf');

    const reset = await repository.resetSettingsToDefaults();
    expect(reset?.activeModel.key).toBe('qwen3_4b_q8');
    expect(reset?.settings.llm_n_ctx).toBe(4096);
    expect(reset?.settings.temperature).toBe(0.2);
    expect(reset?.settings.llm_flash_attn).toBe(true);
    expect(reset?.settings.llm_gguf_path).toBe('/models/Qwen3-4B-Q8_0.gguf');
  });

  it('returns null when selecting a model that has not been downloaded', async () => {
    const db = new SQLiteClient({ dbPath: ':memory:' });
    const repository = new LlmSelectionRepository({ db });

    const result = await repository.selectModel('qwen3_8b_q8');
    expect(result).toBeNull();
    expect(await repository.getActiveModel()).toBeNull();
  });
});
