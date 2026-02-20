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

  it('expands chat view when user interacts with chat interface while collapsed', () => {
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Collapse chat panel' }));
    expect(screen.queryByTestId('chat-view')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Send comment' }));

    expect(screen.getByTestId('chat-view')).toBeTruthy();
  });
});
