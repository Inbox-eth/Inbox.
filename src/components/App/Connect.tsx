import { Button, Group } from "@mantine/core";
import { usePrivy } from "@privy-io/react-auth";
import { useSettings } from "@/hooks/useSettings";
import { useEffect } from "react";

export const Connect = () => {
  const { login, ready, authenticated, user } = usePrivy();
  const { ephemeralAccountEnabled, setEphemeralAccountEnabled } = useSettings();

  // Enable ephemeral account only for Privy email login (embedded wallet), not for external wallets
  useEffect(() => {
    if (
      authenticated &&
      user &&
      user.email &&
      user.wallet &&
      user.wallet.connectorType === "embedded" &&
      !ephemeralAccountEnabled
    ) {
      setEphemeralAccountEnabled(true);
    }
  }, [authenticated, user, ephemeralAccountEnabled, setEphemeralAccountEnabled]);

  return (
    <Group p="md" justify="center">
      <Button size="md" onClick={login} disabled={!ready || authenticated}>
        Connect
      </Button>
    </Group>
  );
};
