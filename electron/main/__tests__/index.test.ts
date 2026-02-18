import { describe, expect, it, vi } from 'vitest';
import { createMainApp } from '../index';

describe('main process bootstrap', () => {
  it('boots without renderer crash path in phase 2 skeleton', async () => {
    const loadURL = vi.fn();
    const loadFile = vi.fn();
    const on = vi.fn();

    const BrowserWindow = vi.fn().mockImplementation(() => ({
      loadURL,
      loadFile,
      on
    }));

    const app = {
      on: vi.fn(),
      quit: vi.fn(),
      whenReady: vi.fn().mockResolvedValue(undefined)
    };

    const ipcMain = {
      handle: vi.fn()
    };

    const main = createMainApp({
      app: app as never,
      BrowserWindow: BrowserWindow as never,
      ipcMain: ipcMain as never
    });

    await main.start();

    expect(app.whenReady).toHaveBeenCalledTimes(1);
    expect(BrowserWindow).toHaveBeenCalledTimes(1);
    expect(ipcMain.handle).toHaveBeenCalled();
    expect(loadURL.mock.calls.length + loadFile.mock.calls.length).toBe(1);
  });
});
