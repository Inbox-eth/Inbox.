import { Button, Group } from "@mantine/core";
import { usePrivy } from "@privy-io/react-auth";
import { useSettings } from "@/hooks/useSettings";
import { useEffect } from "react";

export const Connect = () => {
  const { login, ready, authenticated } = usePrivy();
  const { ephemeralAccountEnabled, setEphemeralAccountEnabled } = useSettings();

  // Enable ephemeral account when authenticated with Privy (email login), but only if not already enabled
  useEffect(() => {
    if (authenticated && !ephemeralAccountEnabled) {
      setEphemeralAccountEnabled(true);
    }
  }, [authenticated, ephemeralAccountEnabled, setEphemeralAccountEnabled]);

  return (
    <Group p="md" justify="center">
      <Button size="md" onClick={login} disabled={!ready || authenticated}>
        Connect
      </Button>
    </Group>
  );
};
