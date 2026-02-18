import type { App, BrowserWindow, BrowserWindowConstructorOptions, IpcMain } from 'electron';
import path from 'node:path';
import { registerIpcHandlers } from './ipc/registerHandlers';

interface BrowserWindowCtor {
  new (options: BrowserWindowConstructorOptions): BrowserWindow;
}

export interface MainProcessDeps {
  app: App;
  BrowserWindow: BrowserWindowCtor;
  ipcMain: IpcMain;
}

function getDefaultDeps(): MainProcessDeps {
  const electron = require('electron') as typeof import('electron');
  return {
    app: electron.app,
    BrowserWindow: electron.BrowserWindow,
    ipcMain: electron.ipcMain
  };
}

export function createMainApp(deps: MainProcessDeps = getDefaultDeps()) {
  let mainWindow: BrowserWindow | null = null;
  let handlersRegistered = false;

  const createWindow = (): BrowserWindow => {
    const preloadPath = path.resolve(__dirname, '../preload/index.js');
    const window = new deps.BrowserWindow({
      width: 1440,
      height: 900,
      minWidth: 1024,
      minHeight: 700,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false
      }
    });

    const devServerUrl = process.env.VITE_DEV_SERVER_URL;
    if (devServerUrl) {
      void window.loadURL(devServerUrl);
    } else {
      const rendererEntry = path.resolve(__dirname, '../../renderer/dist/index.html');
      void window.loadFile(rendererEntry);
    }

    window.on('closed', () => {
      mainWindow = null;
    });
    mainWindow = window;
    return window;
  };

  const registerHandlers = (): readonly string[] => {
    if (handlersRegistered) {
      return [];
    }
    handlersRegistered = true;
    return registerIpcHandlers(deps.ipcMain);
  };

  const start = async (): Promise<void> => {
    registerHandlers();

    deps.app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        deps.app.quit();
      }
    });

    deps.app.on('activate', () => {
      if (!mainWindow) {
        createWindow();
      }
    });

    await deps.app.whenReady();
    if (!mainWindow) {
      createWindow();
    }
  };

  return {
    start,
    createWindow,
    registerHandlers
  };
}

if (!process.env.VITEST) {
  void createMainApp().start();
}
