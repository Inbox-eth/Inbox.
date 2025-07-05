import { Stack, Group, Text } from "@mantine/core";

export const Settings = () => {
  const xmtpEnv = import.meta.env.VITE_XMTP_ENV || 'dev';
  const useSCW = import.meta.env.VITE_USE_SCW === 'true';
  const loggingLevel = import.meta.env.VITE_LOGGING_LEVEL || 'info';
  const disableAnalytics = import.meta.env.VITE_DISABLE_ANALYTICS === 'true';

  return (
    <Stack gap="0">
      <Group justify="space-between">
        <Text fw="bold" size="xs">XMTP network</Text>
        <Text size="xs">{xmtpEnv}</Text>
      </Group>
      <Group justify="space-between">
        <Text size="xs" fw="bold">Use smart contract wallet</Text>
        <Text size="xs">{useSCW ? 'Enabled' : 'Disabled'}</Text>
      </Group>
      <Group justify="space-between">
        <Text size="xs" fw="bold">Logging level</Text>
        <Text size="xs">{loggingLevel}</Text>
      </Group>
      <Group justify="space-between">
        <Text size="xs" fw="bold">Disable analytics</Text>
        <Text size="xs">{disableAnalytics ? 'Enabled' : 'Disabled'}</Text>
      </Group>
    </Stack>
  );
};
