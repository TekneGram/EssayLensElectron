import { describe, expect, it, vi } from 'vitest';
import { ChatRepository } from '../../db/repositories/chatRepository';
import type { LlmRuntimeSettings } from '../../../shared/llmManagerContracts';
import { CHAT_CHANNELS, CHAT_EVENTS, registerChatHandlers } from '../chatHandlers';

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

describe('registerChatHandlers', () => {
  const readySettings: LlmRuntimeSettings = {
    llm_server_path: '/usr/local/bin/llama-server',
    llm_gguf_path: '/models/Qwen3-4B-Q8_0.gguf',
    llm_mmproj_path: null,
    llm_server_url: 'http://127.0.0.1:8080/v1/chat/completions',
    llm_host: '127.0.0.1',
    llm_port: 8080,
    llm_n_ctx: 4096,
    llm_n_threads: null,
    llm_n_gpu_layers: null,
    llm_n_batch: null,
    llm_n_parallel: null,
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

  it('streams llm.chatStream chunks and persists user + assistant messages after final', async () => {
    const harness = createHarness();
    const repository = new ChatRepository();
    const requestActionStream = vi.fn().mockImplementation(async (_action, _payload, onStreamEvent) => {
      onStreamEvent({
        requestId: 'req-1',
        type: 'stream_start',
        data: { clientRequestId: 'client-1', channel: 'meta', text: '', done: false, seq: 1 },
        timestamp: '2026-02-18T00:00:00.000Z'
      });
      onStreamEvent({
        requestId: 'req-1',
        type: 'stream_chunk',
        data: { clientRequestId: 'client-1', channel: 'content', text: 'Assistant ', done: false, seq: 2 },
        timestamp: '2026-02-18T00:00:00.000Z'
      });
      onStreamEvent({
        requestId: 'req-1',
        type: 'stream_done',
        data: { clientRequestId: 'client-1', channel: 'meta', text: '', done: true, seq: 3 },
        timestamp: '2026-02-18T00:00:00.000Z'
      });
      return {
        requestId: 'req-1',
        ok: true,
        data: { reply: 'Assistant reply' },
        timestamp: '2026-02-18T00:00:00.000Z'
      };
    });
    const send = vi.fn();

    registerChatHandlers(
      { handle: harness.handle },
      {
        repository,
        llmOrchestrator: { requestActionStream } as never,
        llmSettingsRepository: { getRuntimeSettings: vi.fn().mockResolvedValue(readySettings) } as never,
        fileExists: vi.fn().mockResolvedValue(true),
        isExecutable: vi.fn().mockResolvedValue(true)
      }
    );

    const sendMessageHandler = harness.getHandler(CHAT_CHANNELS.sendMessage);
    const listMessagesHandler = harness.getHandler(CHAT_CHANNELS.listMessages);

    const sendResult = await sendMessageHandler(
      { sender: { send } },
      { fileId: 'file-1', message: 'Teacher prompt', clientRequestId: 'client-1' }
    );
    expect(sendResult).toEqual({ ok: true, data: { reply: 'Assistant reply' } });

    expect(requestActionStream).toHaveBeenCalledWith(
      'llm.chatStream',
      expect.objectContaining({
        fileId: 'file-1',
        contextText: undefined,
        message: 'Teacher prompt',
        clientRequestId: 'client-1',
        settings: expect.objectContaining({
          llm_server_url: 'http://127.0.0.1:8080/v1/chat/completions'
        })
      }),
      expect.any(Function)
    );
    expect(send).toHaveBeenCalledWith(
      CHAT_EVENTS.streamChunk,
      expect.objectContaining({
        clientRequestId: 'client-1',
        type: 'chunk',
        text: 'Assistant '
      })
    );

    const listResult = await listMessagesHandler({}, { fileId: 'file-1' });
    expect(listResult).toMatchObject({
      ok: true,
      data: {
        messages: [
          {
            role: 'teacher',
            content: 'Teacher prompt',
            relatedFileId: 'file-1'
          },
          {
            role: 'assistant',
            content: 'Assistant reply',
            relatedFileId: 'file-1'
          }
        ]
      }
    });
  });

  it('returns mapped orchestrator failures and does not persist messages', async () => {
    const harness = createHarness();
    const repository = new ChatRepository();
    const requestAction = vi.fn().mockResolvedValue({
      requestId: 'req-timeout',
      ok: false,
      error: {
        code: 'PY_TIMEOUT',
        message: 'Python worker timed out.'
      },
      timestamp: '2026-02-18T00:00:00.000Z'
    });

    registerChatHandlers(
      { handle: harness.handle },
      {
        repository,
        llmOrchestrator: { requestAction } as never,
        llmSettingsRepository: { getRuntimeSettings: vi.fn().mockResolvedValue(readySettings) } as never,
        fileExists: vi.fn().mockResolvedValue(true),
        isExecutable: vi.fn().mockResolvedValue(true)
      }
    );

    const sendMessageHandler = harness.getHandler(CHAT_CHANNELS.sendMessage);
    const listMessagesHandler = harness.getHandler(CHAT_CHANNELS.listMessages);

    const sendResult = await sendMessageHandler({}, { message: 'Teacher prompt' });
    expect(sendResult).toEqual({
      ok: false,
      error: {
        code: 'PY_TIMEOUT',
        message: 'Python worker timed out.'
      }
    });

    const listResult = await listMessagesHandler({}, undefined);
    expect(listResult).toEqual({ ok: true, data: { messages: [] } });
  });

  it('rejects invalid payloads before orchestrator call', async () => {
    const harness = createHarness();
    const requestAction = vi.fn();

    registerChatHandlers(
      { handle: harness.handle },
      {
        repository: new ChatRepository(),
        llmOrchestrator: { requestAction } as never
      }
    );

    const sendMessageHandler = harness.getHandler(CHAT_CHANNELS.sendMessage);
    const sendResult = await sendMessageHandler({}, { message: '   ' });

    expect(sendResult).toEqual({
      ok: false,
      error: {
        code: 'CHAT_SEND_INVALID_PAYLOAD',
        message: 'Chat message payload must include a non-empty message.'
      }
    });
    expect(requestAction).not.toHaveBeenCalled();
  });

  it('returns LLM_NOT_READY when fake mode is off and gguf path is missing', async () => {
    const harness = createHarness();
    const repository = new ChatRepository();
    const requestAction = vi.fn();
    const settings: LlmRuntimeSettings = {
      llm_server_path: '/usr/local/bin/llama-server',
      llm_gguf_path: null,
      llm_mmproj_path: null,
      llm_server_url: 'http://127.0.0.1:8080/v1/chat/completions',
      llm_host: '127.0.0.1',
      llm_port: 8080,
      llm_n_ctx: 4096,
      llm_n_threads: null,
      llm_n_gpu_layers: null,
      llm_n_batch: null,
      llm_n_parallel: null,
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

    registerChatHandlers(
      { handle: harness.handle },
      {
        repository,
        llmOrchestrator: { requestAction } as never,
        llmSettingsRepository: { getRuntimeSettings: vi.fn().mockResolvedValue(settings) } as never,
        fileExists: vi.fn().mockResolvedValue(true),
        isExecutable: vi.fn().mockResolvedValue(true)
      }
    );

    const sendMessageHandler = harness.getHandler(CHAT_CHANNELS.sendMessage);
    const sendResult = await sendMessageHandler({}, { message: 'Teacher prompt' });
    expect(sendResult).toMatchObject({
      ok: false,
      error: {
        code: 'LLM_NOT_READY'
      }
    });
    expect(sendResult).toMatchObject({
      ok: false,
      error: {
        details: {
          issues: [{ code: 'MISSING_GGUF_PATH' }],
          fakeMode: false
        }
      }
    });
    expect(requestAction).not.toHaveBeenCalled();
  });

  it('returns LLM_NOT_READY when fake mode is off and server binary is missing', async () => {
    const harness = createHarness();
    const repository = new ChatRepository();
    const requestAction = vi.fn();
    const settings: LlmRuntimeSettings = {
      llm_server_path: '/tmp/missing-llama-server',
      llm_gguf_path: '/tmp/model.gguf',
      llm_mmproj_path: null,
      llm_server_url: 'http://127.0.0.1:8080/v1/chat/completions',
      llm_host: '127.0.0.1',
      llm_port: 8080,
      llm_n_ctx: 4096,
      llm_n_threads: null,
      llm_n_gpu_layers: null,
      llm_n_batch: null,
      llm_n_parallel: null,
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

    const fileExists = vi.fn(async (targetPath: string) => targetPath !== '/tmp/missing-llama-server');
    registerChatHandlers(
      { handle: harness.handle },
      {
        repository,
        llmOrchestrator: { requestAction } as never,
        llmSettingsRepository: { getRuntimeSettings: vi.fn().mockResolvedValue(settings) } as never,
        fileExists,
        isExecutable: vi.fn().mockResolvedValue(true)
      }
    );

    const sendMessageHandler = harness.getHandler(CHAT_CHANNELS.sendMessage);
    const sendResult = await sendMessageHandler({}, { message: 'Teacher prompt' });
    expect(sendResult).toMatchObject({
      ok: false,
      error: {
        code: 'LLM_NOT_READY',
        details: {
          issues: [{ code: 'SERVER_FILE_NOT_FOUND' }]
        }
      }
    });
    expect(requestAction).not.toHaveBeenCalled();
  });

  it('auto-heals missing server path at chat time when an active model exists', async () => {
    const harness = createHarness();
    const repository = new ChatRepository();
    const requestAction = vi.fn().mockResolvedValue({
      requestId: 'req-1',
      ok: true,
      data: { reply: 'Recovered reply' },
      timestamp: '2026-02-18T00:00:00.000Z'
    });
    const initialSettings: LlmRuntimeSettings = {
      ...readySettings,
      llm_server_path: '__unset_llm_server__'
    };
    const llmSettingsRepository = {
      getRuntimeSettings: vi.fn().mockResolvedValue(initialSettings)
    };
    const llmSelectionRepository = {
      getActiveModel: vi.fn().mockResolvedValue({
        key: 'qwen3_4b_q8',
        displayName: 'Qwen3 4B Q8_0',
        localGgufPath: '/models/Qwen3-4B-Q8_0.gguf',
        localMmprojPath: null,
        downloadedAt: '2026-02-22T10:00:00.000Z',
        isActive: true
      }),
      resetSettingsToDefaults: vi.fn().mockResolvedValue({
        activeModel: {
          key: 'qwen3_4b_q8',
          displayName: 'Qwen3 4B Q8_0',
          localGgufPath: '/models/Qwen3-4B-Q8_0.gguf',
          localMmprojPath: null,
          downloadedAt: '2026-02-22T10:00:00.000Z',
          isActive: true
        },
        settings: {
          ...readySettings,
          llm_server_path: '/runtime/llama-server'
        }
      })
    };

    registerChatHandlers(
      { handle: harness.handle },
      {
        repository,
        llmOrchestrator: { requestAction } as never,
        llmSettingsRepository: llmSettingsRepository as never,
        llmSelectionRepository: llmSelectionRepository as never,
        resolveLlmServerPath: () => '/runtime/llama-server',
        fileExists: vi.fn().mockResolvedValue(true),
        isExecutable: vi.fn().mockResolvedValue(true)
      }
    );

    const sendMessageHandler = harness.getHandler(CHAT_CHANNELS.sendMessage);
    const sendResult = await sendMessageHandler({}, { fileId: 'file-1', message: 'Teacher prompt' });
    expect(sendResult).toEqual({ ok: true, data: { reply: 'Recovered reply' } });
    expect(llmSelectionRepository.resetSettingsToDefaults).toHaveBeenCalledWith('/runtime/llama-server');
    expect(requestAction).toHaveBeenCalledWith(
      'llm.chat',
      expect.objectContaining({
        settings: expect.objectContaining({
          llm_server_path: '/runtime/llama-server'
        })
      })
    );
  });
});
