import { useEffect, useState } from "react";
import {
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
import { Connect } from "@/components/App/Connect";
import { Settings } from "@/components/App/Settings";
import { AddressBadge } from "@/components/AddressBadge";
import { ENSRegistration } from "@/components/App/ENSRegistration";
import { useConnection } from "@/contexts/ConnectionProvider";

export const Welcome = () => {
  const [selectedENS, setSelectedENS] = useState<string | null>(null);
  const { ready, authenticated, account, disconnecting, handleDisconnect } = useConnection();
  const navigate = useNavigate();
  const px = useMatches({ base: "5%", sm: "10%" });
  const ensRequired = import.meta.env.VITE_ENS_REQUIRED !== 'false';
  const isWalletConnected = !!account.address;

  // Automatically navigate to /conversations if ENS is not required and wallet is connected
  useEffect(() => {
    if (!ensRequired && authenticated && account.address) {
      navigate("/conversations");
    }
  }, [ensRequired, authenticated, account.address, navigate]);

  if (!ready) {
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

  return (
    <>
      <LoadingOverlay visible={disconnecting} />
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
            {ensRequired && (
              <ENSRegistration address={account.address || ''} onNameSelected={setSelectedENS} />
            )}
          </Stack>
        )}
        {/* Step 3: Proceed to Inbox button (only if ENS is required) */}
        {isWalletConnected && ensRequired && (
          <Button
            size="md"
            mt="xl"
            onClick={() => navigate("/conversations")}
            disabled={!selectedENS}
          >
            Proceed to Inbox
          </Button>
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
