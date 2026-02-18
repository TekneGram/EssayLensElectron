import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    environmentMatchGlobs: [['renderer/src/**/*.test.tsx', 'jsdom']],
    setupFiles: ['./renderer/src/test/setup.ts']
  }
});
