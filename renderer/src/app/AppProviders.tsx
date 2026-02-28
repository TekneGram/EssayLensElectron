import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { useMemo, type ReactNode } from 'react';
import { ToastContainer } from 'react-toastify';
import { createElectronAssessmentAdapter } from '../adapters/assessment';
import { createElectronChatAdapter } from '../adapters/chat';
import { createElectronLlmManagerAdapter } from '../adapters/llm-manager';
import { createElectronLlmSessionAdapter } from '../adapters/llm-session';
import { createElectronRubricAdapter } from '../adapters/rubric';
import { createElectronWorkspaceAdapter } from '../adapters/workspace';
import { PortsProvider, type AppPorts } from '../ports';
import { AppStateProvider } from '../state';

interface AppProvidersProps {
  queryClient: QueryClient;
  children: ReactNode;
  ports?: Partial<AppPorts>;
}

export function AppProviders({ queryClient, children, ports }: AppProvidersProps) {
  const defaultPorts = useMemo<AppPorts>(
    () => ({
      workspace: createElectronWorkspaceAdapter(),
      assessment: createElectronAssessmentAdapter(),
      chat: createElectronChatAdapter(),
      rubric: createElectronRubricAdapter(),
      llmManager: createElectronLlmManagerAdapter(),
      llmSession: createElectronLlmSessionAdapter()
    }),
    []
  );

  const resolvedPorts = useMemo<AppPorts>(
    () => ({
      workspace: ports?.workspace ?? defaultPorts.workspace,
      assessment: ports?.assessment ?? defaultPorts.assessment,
      chat: ports?.chat ?? defaultPorts.chat,
      rubric: ports?.rubric ?? defaultPorts.rubric,
      llmManager: ports?.llmManager ?? defaultPorts.llmManager,
      llmSession: ports?.llmSession ?? defaultPorts.llmSession
    }),
    [defaultPorts, ports?.assessment, ports?.chat, ports?.llmManager, ports?.llmSession, ports?.rubric, ports?.workspace]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PortsProvider ports={resolvedPorts}>
        <AppStateProvider>
          <ToastContainer position="bottom-right" autoClose={4000} newestOnTop />
          {children}
        </AppStateProvider>
      </PortsProvider>
    </QueryClientProvider>
  );
}
