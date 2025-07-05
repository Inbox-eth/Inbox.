import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render } from '../test-utils';
import { Disconnect } from '../src/components/App/Disconnect';

vi.mock('@privy-io/react-auth', () => ({ usePrivy: vi.fn() }));
vi.mock('react-router', () => ({ ...vi.importActual('react-router'), useNavigate: vi.fn() }));
vi.mock('wagmi', () => ({ useDisconnect: vi.fn() }));
vi.mock('../src/contexts/XMTPContext', () => ({ useXMTP: vi.fn() }));
vi.mock('../src/hooks/useSettings', () => ({ useSettings: vi.fn() }));

import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router';
import { useDisconnect } from 'wagmi';
import { useXMTP } from '../src/contexts/XMTPContext';
import { useSettings } from '../src/hooks/useSettings';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Disconnect', () => {
  it('calls all disconnect logic on mount', () => {
    const logout = vi.fn();
    const disconnect = vi.fn((_, { onSuccess }) => onSuccess && onSuccess());
    const disconnectClient = vi.fn();
    const setEphemeralAccountEnabled = vi.fn();
    const navigate = vi.fn();

    (usePrivy as any).mockReturnValue({ logout });
    (useDisconnect as any).mockReturnValue({ disconnect });
    (useXMTP as any).mockReturnValue({ disconnect: disconnectClient });
    (useSettings as any).mockReturnValue({ ephemeralAccountEnabled: true, setEphemeralAccountEnabled });
    (useNavigate as any).mockReturnValue(navigate);

    render(<Disconnect />);

    expect(logout).toHaveBeenCalled();
    expect(disconnect).toHaveBeenCalled();
    expect(disconnectClient).toHaveBeenCalled();
    expect(setEphemeralAccountEnabled).toHaveBeenCalledWith(false);
    expect(navigate).toHaveBeenCalledWith('/');
  });
}); 