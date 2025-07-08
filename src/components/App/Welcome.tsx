import React, { useEffect, useRef } from "react";
import {
  Anchor,
  LoadingOverlay,
  Stack,
  Text,
  Title,
  useMatches,
  Space,
  Button,
  Group,
} from "@mantine/core";
import { Outlet, useNavigate } from "react-router";
import { hexToUint8Array } from "uint8array-extras";
import { generatePrivateKey } from "viem/accounts";
import { useAccount, useConnect, useSignMessage, useDisconnect } from "wagmi";
import { Connect } from "@/components/App/Connect";
import { Settings } from "@/components/App/Settings";
import { useXMTP } from "@/contexts/XMTPContext";
import {
  createEOASigner,
  createEphemeralSigner,
  createSCWSigner,
} from "@/helpers/createSigner";
import { useRedirect } from "@/hooks/useRedirect";
import { useSettings } from "@/hooks/useSettings";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { AddressBadge } from "@/components/AddressBadge";
import { ENSRegistration } from "@/components/App/ENSRegistration";

export const Welcome = () => {
  const { status } = useConnect();
  const { initializing, client, initialize } = useXMTP();
  const navigate = useNavigate();
  const account = useAccount();
  const { redirectUrl, setRedirectUrl } = useRedirect();
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
  const px = useMatches({
    base: "5%",
    sm: "10%",
  });
  const { user, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();
  const { disconnect } = useDisconnect();
  const { disconnect: disconnectClient } = useXMTP();
  const [disconnecting, setDisconnecting] = React.useState(false);
  const ensRequired = import.meta.env.VITE_ENS_REQUIRED !== 'false';
  const hasSetActiveWallet = useRef(false);
  const { ready } = usePrivy();
  const isWagmiLoading = account.status === "connecting";

  // Debug log for wallet/account restoration
  console.log('Welcome:', { ready, authenticated, accountAddress: account.address, accountStatus: account.status });

  // redirect if there's already a client
  // useEffect(() => {
  //   if (client) {
  //     if (redirectUrl) {
  //       setRedirectUrl("");
  //       void navigate(redirectUrl);
  //     } else {
  //       void navigate("/");
  //     }
  //   }
  // }, [client]);

  // create client if ephemeral account is enabled
  useEffect(() => {
    if (ephemeralAccountEnabled) {
      console.log("[Welcome] Initializing XMTP client for ephemeral account");
      let accountKey = ephemeralAccountKey;
      if (!accountKey) {
        accountKey = generatePrivateKey();
        setEphemeralAccountKey(accountKey);
        console.log("[Welcome] Generated new ephemeral account key");
      }

      const signer = createEphemeralSigner(accountKey);
      void initialize({
        dbEncryptionKey: encryptionKey
          ? hexToUint8Array(encryptionKey)
          : undefined,
        env: environment,
        loggingLevel,
        signer,
      });
    } else {
      console.log("[Welcome] Ephemeral account not enabled, skipping XMTP client init");
    }
  }, [
    ephemeralAccountEnabled,
    ephemeralAccountKey,
    encryptionKey,
    environment,
    loggingLevel,
  ]);

  // create client if wallet is connected
  useEffect(() => {
    console.log("[Welcome] [XMTP Init Effect] wagmi account.address:", account.address);
    console.log("[Welcome] [XMTP Init Effect] wagmi account.chainId:", account.chainId);
    console.log("[Welcome] [XMTP Init Effect] useSCW:", useSCW);
    if (!account.address || (useSCW && !account.chainId)) {
      return;
    }
    void initialize({
      dbEncryptionKey: encryptionKey
        ? hexToUint8Array(encryptionKey)
        : undefined,
      env: environment,
      loggingLevel,
      signer: useSCW
        ? createSCWSigner(
            account.address,
            (message: string) => signMessageAsync({ message }),
            account.chainId,
          )
        : createEOASigner(account.address, (message: string) =>
            signMessageAsync({ message }),
          ),
    });
  }, [account.address, account.chainId, useSCW, signMessageAsync]);

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
        setActiveWallet(matchingWallet);
      }
    }
  }, [
    authenticated,
    user,
    user?.wallet,
    user?.wallet?.address,
    account.address,
    wallets,
    setActiveWallet,
  ]);

  // Automatically navigate to /conversations if ENS is not required and wallet is connected
  useEffect(() => {
    if (!ensRequired && authenticated && account.address) {
      navigate("/conversations");
    }
  }, [ensRequired, authenticated, account.address, navigate]);

  // Wait for Privy and Wagmi to finish restoring before showing Connect
  if (!ready || isWagmiLoading) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: '100vh' }}>
        <LoadingOverlay visible />
      </Stack>
    );
  }

  if (!authenticated || !account.address) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Title order={1}>Inbox App</Title>
        <Text fs="italic" size="xl">
          A simple inbox app built with XMTP
        </Text>
        <Space h="xl" />
        <Connect />
        <Text fs="italic" size="xs" mt="xl">
          This is a simple inbox app built with XMTP. It is not affiliated with XMTP.
        </Text>
        <Space h="xl" />
        <Title order={3} size="md" mt="xl">
          Settings
        </Title>
        <Settings />
      </Stack>
    );
  }

  const isBusy = status === "pending" || initializing || disconnecting;
  const isWalletConnected = !!account.address;

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      setEphemeralAccountEnabled(false);
      await logout();
      await new Promise((resolve) => {
        disconnect(undefined, {
          onSuccess: resolve,
        });
      });
      disconnectClient();
      navigate("/welcome");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <>
      <LoadingOverlay visible={isBusy} />
      <Stack gap="xl" py={40} px={px} align="center">
        <Stack gap="md" align="center">
          <Title order={1}>Inbox App</Title>
          <Text fs="italic" size="xl">
            A simple inbox app built with XMTP
          </Text>
        </Stack>
        <Space h="xl" />
        {/* Step 1: Connect Wallet */}
        <Connect />
        {/* Step 2: Display wallet info if connected */}
        {isWalletConnected && (
          <Stack gap="sm" align="center">
            <Title order={3} size="md">Connected Wallet</Title>
            <Group>
              <AddressBadge address={account.address || ''} size="lg" />
              <Button size="xs" color="red" variant="outline" onClick={handleDisconnect} loading={disconnecting}>
                Disconnect
              </Button>
            </Group>
            {/* ENS Registration Step (optional) */}
            {ensRequired && <ENSRegistration address={account.address || ''} />}
          </Stack>
        )}
        {/* Step 3: Proceed to Inbox button (only if ENS is required) */}
        {isWalletConnected && ensRequired && (
          <Button size="md" mt="xl" onClick={() => navigate("/conversations")}>Proceed to Inbox</Button>
        )}
        <Text fs="italic" size="xs" mt="xl">
          This is a simple inbox app built with XMTP. It is not affiliated with XMTP.
        </Text>
        <Space h="xl" />
        <Title order={3} size="md" mt="xl">
          Settings
        </Title>
        <Settings />
      </Stack>
      <Outlet />
    </>
  );
};
