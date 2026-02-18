import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../../App';
import { AppStateProvider } from '../../../state';

describe('App shell regions', () => {
  it('renders all top-level shell regions', () => {
    render(
      <AppStateProvider>
        <App />
      </AppStateProvider>
    );

    expect(screen.getByTestId('loader-bar')).toBeTruthy();
    expect(screen.getByTestId('file-display-bar')).toBeTruthy();
    expect(screen.getByTestId('assessment-window')).toBeTruthy();
    expect(screen.getByTestId('chat-view')).toBeTruthy();
    expect(screen.getByTestId('chat-interface')).toBeTruthy();
  });
});
