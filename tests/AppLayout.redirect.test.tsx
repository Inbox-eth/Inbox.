import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '../test-utils';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter, Route, Routes } from 'react-router';
import { App } from '../src/components/App/App';
import { ConnectionContext } from '../src/contexts/ConnectionProvider';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Client } from '@xmtp/browser-sdk';
vi.mock('@privy-io/react-auth', () => ({
  usePrivy: vi.fn(),
}));
import { usePrivy } from '@privy-io/react-auth';

const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

// Helper to render with context and router
function renderWithProviders({ authenticated, accountStatus, accountAddress, initialEntries = ['/'] }) {
  // Create a minimal mock client
  const mockClient = { accountIdentifier: { identifier: accountAddress || '0x123' } } as unknown as Client<any>;
  const queryClient = new QueryClient();
  return render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <ConnectionContext.Provider value={{
            ready: true,
            authenticated,
            account: {
              address: accountAddress,
              addresses: [],
              chain: undefined,
              chainId: undefined,
              connector: undefined,
              isConnecting: false,
              isReconnecting: false,
              isConnected: accountStatus === 'connected',
              isDisconnected: accountStatus === 'disconnected',
              status: accountStatus,
            } as any,
            client: mockClient,
            initializing: false,
            disconnecting: false,
            handleDisconnect: vi.fn(),
            ephemeralAccountEnabled: false,
            setEphemeralAccountEnabled: () => {},
          }}>
            <MemoryRouter initialEntries={initialEntries}>
              <App />
            </MemoryRouter>
          </ConnectionContext.Provider>
        </WagmiProvider>
      </QueryClientProvider>
    </MantineProvider>
  );
}

describe('App redirect logic', () => {
  it('redirects unauthenticated user to /welcome', async () => {
    (usePrivy as any).mockReturnValue({ ready: true, authenticated: false });
    const { getByText } = renderWithProviders({
      authenticated: false,
      accountStatus: 'disconnected',
      accountAddress: undefined,
      initialEntries: ['/'],
    });
    await waitFor(() => {
      expect(getByText('Connect')).toBeInTheDocument();
    });
  });

  it('redirects authenticated user with connected wallet to /conversations', async () => {
    (usePrivy as any).mockReturnValue({ ready: true, authenticated: true });
    const { getByText } = renderWithProviders({
      authenticated: true,
      accountStatus: 'connected',
      accountAddress: '0x123',
      initialEntries: ['/'],
    });
    await waitFor(() => {
      expect(getByText('No conversation selected')).toBeInTheDocument();
    });
  });

  // Add more cases as needed (hydration, loading, etc)
});