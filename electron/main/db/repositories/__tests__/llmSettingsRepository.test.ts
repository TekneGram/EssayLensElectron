import { describe, expect, it } from 'vitest';
import { SQLiteClient } from '../../sqlite';
import { LlmSettingsRepository } from '../llmSettingsRepository';

describe('LlmSettingsRepository', () => {
  it('updates runtime settings and persists boolean conversions', async () => {
    const db = new SQLiteClient({ dbPath: ':memory:' });
    const repository = new LlmSettingsRepository(db);

    const before = await repository.getRuntimeSettings();
    expect(before.llm_flash_attn).toBe(true);

    const updated = await repository.updateRuntimeSettings({
      llm_flash_attn: false,
      llm_use_jinja: false,
      use_fake_reply: false,
      llm_n_threads: 8,
      top_p: 0.88
    });

    expect(updated.llm_flash_attn).toBe(false);
    expect(updated.llm_use_jinja).toBe(false);
    expect(updated.use_fake_reply).toBe(false);
    expect(updated.llm_n_threads).toBe(8);
    expect(updated.top_p).toBe(0.88);

    const persisted = await repository.getRuntimeSettings();
    expect(persisted).toEqual(updated);
  });

  it('returns current settings when update payload is empty', async () => {
    const db = new SQLiteClient({ dbPath: ':memory:' });
    const repository = new LlmSettingsRepository(db);

    const before = await repository.getRuntimeSettings();
    const unchanged = await repository.updateRuntimeSettings({});
    expect(unchanged).toEqual(before);
  });
});
