import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useDisconnect } from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { useSettings } from "@/hooks/useSettings";
import { useXMTP } from "@/contexts/XMTPContext";
import { createEOASigner, createEphemeralSigner, createSCWSigner } from "@/helpers/createSigner";
import { hexToUint8Array } from "uint8array-extras";
import { generatePrivateKey } from "viem/accounts";
import type { Client } from "@xmtp/browser-sdk";
import type { ContentTypes } from "@/contexts/XMTPContext";

export interface ConnectionContextValue {
  ready: boolean;
  authenticated: boolean;
  account: ReturnType<typeof useAccount>;
  client: Client<ContentTypes> | undefined;
  initializing: boolean;
  disconnecting: boolean;
  handleDisconnect: () => Promise<void>;
  ephemeralAccountEnabled: boolean;
  setEphemeralAccountEnabled: (val: boolean | ((prev: boolean) => boolean)) => void;
}

const ConnectionContext = createContext<ConnectionContextValue | undefined>(undefined);

export { ConnectionContext };

export const ConnectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { ready, authenticated, user, logout } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();
  const account = useAccount();
  const { signMessageAsync } = useSignMessage();
  const {
    encryptionKey,
    environment,
    ephemeralAccountEnabled,
    ephemeralAccountKey,
    setEphemeralAccountKey,
    setEphemeralAccountEnabled,
    loggingLevel,
    useSCW,
  } = useSettings();
  const { client, initializing, initialize, setClient, disconnect } = useXMTP();
  const [disconnecting, setDisconnecting] = useState(false);
  const hasSetActiveWallet = useRef(false);
  const { disconnect: wagmiDisconnect } = useDisconnect();

  // Debug log on every render
  console.log('[ConnectionProvider] Render', {
    accountAddress: account.address,
    clientAddress: client?.accountIdentifier?.identifier,
    ephemeralAccountEnabled,
    authenticated,
    user,
  });

  // Ephemeral account logic
  useEffect(() => {
    if (ephemeralAccountEnabled) {
      let accountKey = ephemeralAccountKey;
      if (!accountKey) {
        accountKey = generatePrivateKey();
        setEphemeralAccountKey(accountKey);
        console.log('[ConnectionProvider] Generated new ephemeral account key');
      }
      const signer = createEphemeralSigner(accountKey);
      console.log('[ConnectionProvider] Initializing XMTP client with ephemeral signer', { accountKey });
      void initialize({
        dbEncryptionKey: encryptionKey ? hexToUint8Array(encryptionKey) : undefined,
        env: environment,
        loggingLevel,
        signer,
      }).then((client) => {
        console.log('[ConnectionProvider] Ephemeral XMTP client initialized', { client });
      }).catch((e) => {
        console.error('[ConnectionProvider] Failed to initialize ephemeral XMTP client', e);
      });
    }
  }, [ephemeralAccountEnabled, ephemeralAccountKey, encryptionKey, environment, loggingLevel]);

  // Wallet connection and XMTP client init
  useEffect(() => {
    if (!ephemeralAccountEnabled && account.address && (!client || client.accountIdentifier?.identifier.toLowerCase() !== account.address.toLowerCase())) {
      // If there is an existing client for a different address, disconnect it first!
      if (client) {
        console.log('[ConnectionProvider] Disconnecting old XMTP client before initializing new one');
        disconnect();
        setClient(undefined);
      }
      console.log('[ConnectionProvider][DEBUG] About to initialize XMTP client. Wallet address:', account.address, 'ChainId:', account.chainId, 'useSCW:', useSCW);
      console.log('[ConnectionProvider][DEBUG] Current client:', client);
      console.log('[ConnectionProvider] Initializing XMTP client with wallet signer', { address: account.address, chainId: account.chainId, useSCW });
      void initialize({
        dbEncryptionKey: encryptionKey ? hexToUint8Array(encryptionKey) : undefined,
        env: environment,
        loggingLevel,
        signer: useSCW
          ? createSCWSigner(
              account.address,
              (message) => signMessageAsync({ message }),
              account.chainId
            )
          : createEOASigner(account.address, (message) => signMessageAsync({ message })),
      }).then((client) => {
        console.log('[ConnectionProvider] Wallet XMTP client initialized', { client });
      }).catch((e) => {
        console.error('[ConnectionProvider] Failed to initialize wallet XMTP client', e);
      });
    }
  }, [ephemeralAccountEnabled, account.address, account.chainId, useSCW, signMessageAsync, encryptionKey, environment, loggingLevel]);

  // Ensure wagmi is synced with Privy's active injected wallet
  useEffect(() => {
    if (
      authenticated &&
      user &&
      user.wallet &&
      user.wallet.connectorType !== "embedded" &&
      user.wallet.address &&
      !account.address &&
      wallets &&
      setActiveWallet &&
      !hasSetActiveWallet.current
    ) {
      const matchingWallet = wallets.find(
        (w) =>
          w.connectorType === user.wallet?.connectorType &&
          w.address === user.wallet?.address
      );
      if (matchingWallet) {
        hasSetActiveWallet.current = true;
        console.log('[ConnectionProvider] Setting active wallet for wagmi', matchingWallet);
        setActiveWallet(matchingWallet);
      }
    }
  }, [authenticated, user, user?.wallet, user?.wallet?.address, account.address, wallets, setActiveWallet]);

  // Disconnect logic
  const handleDisconnect = useCallback(async () => {
    console.log('[ConnectionProvider] handleDisconnect');
    setDisconnecting(true);
    try {
      console.log('[ConnectionProvider] Disconnecting...');
      setEphemeralAccountEnabled(false);
      await logout();
      disconnect();
      setClient(undefined);
      if (wagmiDisconnect) {
        wagmiDisconnect(); // This will clear the wagmi account state
      }
      console.log('[ConnectionProvider] Disconnected and cleared client');
    } finally {
      setDisconnecting(false);
    }
  }, [logout, disconnect, setClient, setEphemeralAccountEnabled, wagmiDisconnect]);

  return (
    <ConnectionContext.Provider
      value={{
        ready,
        authenticated,
        account,
        client,
        initializing,
        disconnecting,
        handleDisconnect,
        ephemeralAccountEnabled,
        setEphemeralAccountEnabled,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error("useConnection must be used within a ConnectionProvider");
  return ctx;
}; 