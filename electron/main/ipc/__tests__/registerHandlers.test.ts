import { describe, expect, it, vi } from 'vitest';
import { ALL_IPC_CHANNELS, registerIpcHandlers } from '../registerHandlers';

describe('registerIpcHandlers', () => {
  it('registers all expected IPC channels', () => {
    const handle = vi.fn();
    const channels = registerIpcHandlers({ handle });

    expect(channels).toEqual(ALL_IPC_CHANNELS);
    expect(handle).toHaveBeenCalledTimes(ALL_IPC_CHANNELS.length);

    const registeredChannels = handle.mock.calls.map(([channel]) => channel);
    expect(new Set(registeredChannels)).toEqual(new Set(ALL_IPC_CHANNELS));
  });
});
