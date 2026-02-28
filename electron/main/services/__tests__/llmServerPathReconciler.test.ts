import { describe, expect, it, vi } from 'vitest';
import { reconcileDevLlmServerPath } from '../llmServerPathReconciler';

describe('reconcileDevLlmServerPath', () => {
  it('does nothing outside dev mode', async () => {
    const settingsRepository = {
      getRuntimeSettings: vi.fn(),
      updateRuntimeSettings: vi.fn()
    };

    await reconcileDevLlmServerPath({
      isDevMode: () => false,
      settingsRepository
    });

    expect(settingsRepository.getRuntimeSettings).not.toHaveBeenCalled();
    expect(settingsRepository.updateRuntimeSettings).not.toHaveBeenCalled();
  });

  it('resets missing current path to resolved dev path', async () => {
    const settingsRepository = {
      getRuntimeSettings: vi.fn().mockResolvedValue({
        llm_server_path: '',
        llm_gguf_path: '/models/model.gguf'
      }),
      updateRuntimeSettings: vi.fn().mockResolvedValue(undefined)
    };

    await reconcileDevLlmServerPath({
      isDevMode: () => true,
      settingsRepository,
      resolveDevServerPath: () => '/repo/vendor/llama-server/darwin-arm64/llama-server'
    });

    expect(settingsRepository.updateRuntimeSettings).toHaveBeenCalledWith({
      llm_server_path: '/repo/vendor/llama-server/darwin-arm64/llama-server'
    });
  });

  it('resets packaged path to resolved dev path', async () => {
    const settingsRepository = {
      getRuntimeSettings: vi.fn().mockResolvedValue({
        llm_server_path: '/repo/dist/mac-arm64/app.app/Contents/Resources/llama-server/darwin-arm64/llama-server',
        llm_gguf_path: '/models/model.gguf'
      }),
      updateRuntimeSettings: vi.fn().mockResolvedValue(undefined)
    };

    await reconcileDevLlmServerPath({
      isDevMode: () => true,
      settingsRepository,
      pathExists: vi.fn().mockResolvedValue(true),
      resolveDevServerPath: () => '/repo/vendor/llama-server/darwin-arm64/llama-server'
    });

    expect(settingsRepository.updateRuntimeSettings).toHaveBeenCalledWith({
      llm_server_path: '/repo/vendor/llama-server/darwin-arm64/llama-server'
    });
  });

  it('keeps a valid custom dev path', async () => {
    const settingsRepository = {
      getRuntimeSettings: vi.fn().mockResolvedValue({
        llm_server_path: '/custom/dev/llama-server',
        llm_gguf_path: '/models/model.gguf'
      }),
      updateRuntimeSettings: vi.fn().mockResolvedValue(undefined)
    };

    await reconcileDevLlmServerPath({
      isDevMode: () => true,
      settingsRepository,
      pathExists: vi.fn().mockResolvedValue(true),
      resolveDevServerPath: () => '/repo/vendor/llama-server/darwin-arm64/llama-server'
    });

    expect(settingsRepository.updateRuntimeSettings).not.toHaveBeenCalled();
  });
});

