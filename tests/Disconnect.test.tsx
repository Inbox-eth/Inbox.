import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render } from '../test-utils';
import { Disconnect } from '../src/components/App/Disconnect';
import { waitFor } from '@testing-library/react';
import { ConnectionContext } from '../src/contexts/ConnectionProvider';

vi.mock('react-router', () => ({ ...vi.importActual('react-router'), useNavigate: vi.fn() }));

import { useNavigate } from 'react-router';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Disconnect', () => {
  it('calls handleDisconnect and navigates to /welcome on mount', async () => {
    const handleDisconnect = vi.fn();
    const navigate = vi.fn();

    (useNavigate as any).mockReturnValue(navigate);

    render(
      <ConnectionContext.Provider value={{
        handleDisconnect,
        // Provide dummy values for required context fields
        ready: true,
        authenticated: false,
        account: {
          address: undefined,
          addresses: [],
          chain: undefined,
          chainId: undefined,
          connector: undefined,
          isConnecting: false,
          isReconnecting: false,
          isConnected: false,
          isDisconnected: true,
          status: 'disconnected',
        } as any,
        client: undefined,
        initializing: false,
        disconnecting: false,
        ephemeralAccountEnabled: false,
        setEphemeralAccountEnabled: () => {},
      }}>
        <Disconnect />
      </ConnectionContext.Provider>
    );

    await waitFor(() => {
      expect(handleDisconnect).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith('/welcome');
    });
  });
}); 