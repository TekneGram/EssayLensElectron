import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../../App';
import { AppProviders } from '../../../app/AppProviders';
import { createAppQueryClient } from '../../../app/queryClient';

function renderApp() {
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
