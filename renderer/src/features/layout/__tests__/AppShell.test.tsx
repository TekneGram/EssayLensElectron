import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../../App';
import { AppProviders } from '../../../app/AppProviders';
import { createAppQueryClient } from '../../../app/queryClient';

describe('App shell regions', () => {
  it('renders all top-level shell regions', () => {
    const queryClient = createAppQueryClient();
    render(
      <AppProviders queryClient={queryClient}>
        <App />
      </AppProviders>
    );

    expect(screen.getByTestId('loader-bar')).toBeTruthy();
    expect(screen.getByTestId('file-display-bar')).toBeTruthy();
    expect(screen.getByTestId('assessment-window')).toBeTruthy();
    expect(screen.getByTestId('chat-view')).toBeTruthy();
    expect(screen.getByTestId('chat-interface')).toBeTruthy();
  });
});
