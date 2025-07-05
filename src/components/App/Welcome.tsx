import {
  Anchor,
  LoadingOverlay,
  Stack,
  Text,
  Title,
  useMatches,
  Space,
} from "@mantine/core";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { hexToUint8Array } from "uint8array-extras";
import { generatePrivateKey } from "viem/accounts";
import { useAccount, useConnect, useSignMessage } from "wagmi";
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
    loggingLevel,
    useSCW,
  } = useSettings();
  const px = useMatches({
    base: "5%",
    sm: "10%",
  });

  // redirect if there's already a client
  useEffect(() => {
    if (client) {
      if (redirectUrl) {
        setRedirectUrl("");
        void navigate(redirectUrl);
      } else {
        void navigate("/");
      }
    }
  }, [client]);

  // create client if ephemeral account is enabled
  useEffect(() => {
    if (ephemeralAccountEnabled) {
      let accountKey = ephemeralAccountKey;
      if (!accountKey) {
        accountKey = generatePrivateKey();
        setEphemeralAccountKey(accountKey);
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

  const isBusy = status === "pending" || initializing;

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
        <Stack gap="md">
          
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
      </Stack>
      <Outlet />
    </>
  );
};
