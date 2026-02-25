import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../../App';
import { AppProviders } from '../../../app/AppProviders';
import { createAppQueryClient } from '../../../app/queryClient';

function installWindowApiMocks() {
  Object.defineProperty(window, 'api', {
    value: {
      workspace: {
        selectFolder: async () => ({ ok: true, data: { folder: null } }),
        listFiles: async () => ({ ok: true, data: { files: [] } }),
        getCurrentFolder: async () => ({ ok: true, data: { folder: null } })
      },
      assessment: {
        listFeedback: async () => ({ ok: true, data: { feedback: [] } }),
        addFeedback: async () => ({ ok: true, data: { feedback: null } })
      },
      rubric: {
        listRubrics: async () => ({ ok: true, data: { rubrics: [] } }),
        getGradingContext: async () =>
          ({ ok: true, data: { selectedRubricId: null, selectedMatrix: null, availableRubrics: [] } }),
        getFileScores: async () => ({ ok: true, data: { rubricId: null, selections: [] } }),
        clearAppliedRubric: async () => ({ ok: true, data: { cleared: true } }),
        saveFileScores: async () => ({ ok: true, data: { rubricId: null, selections: [], updatedAt: new Date().toISOString() } }),
        setLastUsed: async () => ({ ok: true, data: { rubricId: null, updatedAt: new Date().toISOString() } }),
        getMatrix: async () => ({ ok: true, data: { matrix: null } }),
        updateMatrix: async () => ({ ok: true, data: { matrix: null } }),
        createRubric: async () => ({ ok: true, data: { rubric: null } }),
        cloneRubric: async () => ({ ok: true, data: { rubric: null } }),
        deleteRubric: async () => ({ ok: true, data: { deleted: true } })
      },
      chat: {
        sendMessage: async () => ({ ok: true, data: { reply: 'stub-reply' } })
      },
      llmManager: {
        listCatalogModels: async () => ({ ok: true, data: { models: [] } }),
        listDownloadedModels: async () => ({ ok: true, data: { models: [] } }),
        getActiveModel: async () => ({ ok: true, data: { model: null } }),
        getSettings: async () =>
          ({
            ok: true,
            data: {
              settings: {
                llm_host: '127.0.0.1',
                llm_port: 8080,
                llm_n_ctx: 4096,
                max_tokens: 1024,
                temperature: 0.2,
                top_p: 0.95,
                top_k: 50,
                repeat_penalty: 1.1,
                llm_use_jinja: true,
                llm_cache_prompt: true,
                llm_flash_attn: true
              }
            }
          }),
        selectModel: async () => ({ ok: true, data: { model: null } }),
        updateSettings: async () => ({ ok: true, data: { settings: {} } }),
        resetSettingsToDefaults: async () => ({ ok: true, data: { settings: {}, activeModel: null } }),
        onDownloadProgress: () => () => {}
      }
    },
    configurable: true
  });
}

function renderApp() {
  installWindowApiMocks();
  const queryClient = createAppQueryClient();
  render(
    <AppProviders queryClient={queryClient}>
      <App />
    </AppProviders>
  );
}

describe('Chat collapse behavior', () => {
  it('collapses chat view into a thin rail and can expand it again', () => {
    renderApp();

    const shell = screen.getByTestId('app-shell');
    expect(shell.getAttribute('data-chat-collapsed')).toBe('false');
    expect(screen.getByTestId('chat-view')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Collapse chat panel' }));

    expect(shell.getAttribute('data-chat-collapsed')).toBe('true');
    expect(screen.queryByTestId('chat-view')).toBeNull();
    expect(screen.getByTestId('chat-collapsed-rail')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Expand chat panel' }));

    expect(shell.getAttribute('data-chat-collapsed')).toBe('false');
    expect(screen.getByTestId('chat-view')).toBeTruthy();
  });

  it('keeps chat view collapsed while typing and sending comment mode input', () => {
    renderApp();

    const shell = screen.getByTestId('app-shell');
    fireEvent.click(screen.getByRole('button', { name: 'Collapse chat panel' }));
    expect(screen.queryByTestId('chat-view')).toBeNull();
    expect(shell.getAttribute('data-chat-collapsed')).toBe('true');

    const input = screen.getByRole('textbox', { name: 'Message' });
    fireEvent.focus(input);
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: 'Keep this as comment mode.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send comment' }));

    expect(shell.getAttribute('data-chat-collapsed')).toBe('true');
    expect(screen.queryByTestId('chat-view')).toBeNull();
  });

  it('expands chat view only when chat mode message is sent', () => {
    renderApp();

    const shell = screen.getByTestId('app-shell');
    fireEvent.click(screen.getByRole('button', { name: 'Collapse chat panel' }));
    expect(shell.getAttribute('data-chat-collapsed')).toBe('true');
    expect(screen.queryByTestId('chat-view')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Switch to chat mode' }));
    const input = screen.getByRole('textbox', { name: 'Message' });
    fireEvent.change(input, { target: { value: 'Open panel from chat send.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send chat message' }));

    expect(shell.getAttribute('data-chat-collapsed')).toBe('false');
    expect(screen.getByTestId('chat-view')).toBeTruthy();
  });

  it('expands chat view when enter submits in chat mode', () => {
    renderApp();

    const shell = screen.getByTestId('app-shell');
    fireEvent.click(screen.getByRole('button', { name: 'Collapse chat panel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Switch to chat mode' }));
    const input = screen.getByRole('textbox', { name: 'Message' });
    fireEvent.change(input, { target: { value: 'Open panel from enter.' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(shell.getAttribute('data-chat-collapsed')).toBe('false');
    expect(screen.getByTestId('chat-view')).toBeTruthy();
  });
});
