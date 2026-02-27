import { describe, expect, it, vi } from 'vitest';
import type { LlmRuntimeSettings } from '../../../shared/llmManagerContracts';
import { LLM_SERVER_CHANNELS, registerLlmServerHandlers } from '../llmServerHandlers';

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

describe('registerLlmServerHandlers', () => {
  it('starts, checks status, and stops llm server runtime through orchestrator actions', async () => {
    const harness = createHarness();
    const requestAction = vi
      .fn()
      .mockResolvedValueOnce({
        requestId: 'start-1',
        ok: true,
        data: { warmed: true, fakeMode: false, serverRunning: true },
        timestamp: '2026-02-27T00:00:00.000Z'
      })
      .mockResolvedValueOnce({
        requestId: 'status-1',
        ok: true,
        data: { hasRuntime: true, runtimeKey: ['real'], serverRunning: true },
        timestamp: '2026-02-27T00:00:00.000Z'
      })
      .mockResolvedValueOnce({
        requestId: 'stop-1',
        ok: true,
        data: { stopped: true, hasRuntime: false, serverRunning: false },
        timestamp: '2026-02-27T00:00:00.000Z'
      });
    const getRuntimeSettings = vi.fn().mockResolvedValue(settingsFixture);

    registerLlmServerHandlers(
      { handle: harness.handle },
      {
        llmOrchestrator: { requestAction } as never,
        llmSettingsRepository: { getRuntimeSettings } as never
      }
    );

    const startHandler = harness.getHandler(LLM_SERVER_CHANNELS.start);
    const statusHandler = harness.getHandler(LLM_SERVER_CHANNELS.status);
    const stopHandler = harness.getHandler(LLM_SERVER_CHANNELS.stop);

    await expect(startHandler({}, undefined)).resolves.toEqual({
      ok: true,
      data: { warmed: true, fakeMode: false, serverRunning: true }
    });
    await expect(statusHandler({}, undefined)).resolves.toEqual({
      ok: true,
      data: { hasRuntime: true, runtimeKey: ['real'], serverRunning: true }
    });
    await expect(stopHandler({}, undefined)).resolves.toEqual({
      ok: true,
      data: { stopped: true, hasRuntime: false, serverRunning: false }
    });

    expect(getRuntimeSettings).toHaveBeenCalledTimes(1);
    expect(requestAction).toHaveBeenNthCalledWith(1, 'llm.server.start', { settings: settingsFixture });
    expect(requestAction).toHaveBeenNthCalledWith(2, 'llm.server.status', {});
    expect(requestAction).toHaveBeenNthCalledWith(3, 'llm.server.stop', {});
  });

  it('returns invalid-response error if python response schema is wrong', async () => {
    const harness = createHarness();
    registerLlmServerHandlers(
      { handle: harness.handle },
      {
        llmOrchestrator: {
          requestAction: vi.fn().mockResolvedValue({
            requestId: 'start-invalid',
            ok: true,
            data: { warmed: 'yes' },
            timestamp: '2026-02-27T00:00:00.000Z'
          })
        } as never,
        llmSettingsRepository: { getRuntimeSettings: vi.fn().mockResolvedValue(settingsFixture) } as never
      }
    );

    const startHandler = harness.getHandler(LLM_SERVER_CHANNELS.start);
    await expect(startHandler({}, undefined)).resolves.toEqual({
      ok: false,
      error: {
        code: 'LLM_SERVER_START_INVALID_RESPONSE',
        message: 'Python worker returned invalid start payload.',
        details: { warmed: 'yes' }
      }
    });
  });
});
