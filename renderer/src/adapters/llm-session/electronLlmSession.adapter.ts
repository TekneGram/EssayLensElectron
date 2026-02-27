import type { EssayLensApi } from '../../../../electron/preload/apiTypes';
import type { LlmSessionPort } from '../../ports';

function getElectronLlmSessionApi(): EssayLensApi['llmSession'] {
  const appWindow = window as Window & { api?: { llmSession?: EssayLensApi['llmSession'] } };
  if (!appWindow.api?.llmSession) {
    throw new Error('window.api.llmSession is not available.');
  }

  return appWindow.api.llmSession;
}

export function createElectronLlmSessionAdapter(): LlmSessionPort {
  return {
    create: (request) => getElectronLlmSessionApi().create(request),
    clear: (request) => getElectronLlmSessionApi().clear(request),
    getTurns: (request) => getElectronLlmSessionApi().getTurns(request),
    listByFile: (request) => getElectronLlmSessionApi().listByFile(request)
  };
}
