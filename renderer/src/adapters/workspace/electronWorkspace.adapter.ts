import type { EssayLensApi } from '../../../../electron/preload/apiTypes';
import type { WorkspacePort } from '../../ports';

function getElectronWorkspaceApi(): EssayLensApi['workspace'] {
  const appWindow = window as Window & { api?: { workspace?: EssayLensApi['workspace'] } };
  if (!appWindow.api?.workspace) {
    throw new Error('window.api.workspace is not available.');
  }

  return appWindow.api.workspace;
}

export function createElectronWorkspaceAdapter(): WorkspacePort {
  return {
    selectFolder: () => getElectronWorkspaceApi().selectFolder(),
    listFiles: (folderId) => getElectronWorkspaceApi().listFiles(folderId)
  };
}
