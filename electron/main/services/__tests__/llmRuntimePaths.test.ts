import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveLlamaServerPath } from '../llmRuntimePaths';

describe('resolveLlamaServerPath', () => {
  it('resolves vendored llama-server path in dev mode', () => {
    const resolved = resolveLlamaServerPath({
      mode: 'dev',
      platform: 'darwin',
      arch: 'arm64',
      devRootPath: '/workspace/EssayLensElectron'
    });
    expect(resolved).toBe(
      path.resolve('/workspace/EssayLensElectron', 'vendor', 'llama-server', 'darwin-arm64', 'llama-server')
    );
  });

  it('resolves bundled llama-server path in packaged mode', () => {
    const resolved = resolveLlamaServerPath({
      mode: 'packaged',
      platform: 'win32',
      arch: 'x64',
      resourcesPath: 'C:\\EssayLens\\resources'
    });
    expect(resolved).toBe(
      path.resolve('C:\\EssayLens\\resources', 'llama-server', 'win32-x64', 'llama-server.exe')
    );
  });
});

