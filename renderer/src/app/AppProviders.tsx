import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ToastContainer } from 'react-toastify';
import { AppStateProvider } from '../state';

interface AppProvidersProps {
  queryClient: QueryClient;
  children: ReactNode;
}

export function AppProviders({ queryClient, children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        <ToastContainer position="bottom-right" autoClose={4000} newestOnTop />
        {children}
      </AppStateProvider>
    </QueryClientProvider>
  );
}
