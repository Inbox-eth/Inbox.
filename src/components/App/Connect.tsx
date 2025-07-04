import { Button, Group } from "@mantine/core";
import { usePrivy } from "@privy-io/react-auth";

export const Connect = () => {
  const { login, ready, authenticated } = usePrivy();

  return (
    <Group p="md" justify="center">
      <Button size="md" onClick={login} disabled={!ready || authenticated}>
        Connect
      </Button>
    </Group>
  );
};
