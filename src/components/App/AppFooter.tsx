import { Anchor, Box, Flex, Group, Image, Text } from "@mantine/core";
import logo from "@/assets/xmtp-icon.png";

export const AppFooter: React.FC = () => {
  return (
    <Group justify="space-between" align="center" wrap="nowrap" mt="md">
      <Box w="100%" ta="center">
        Inbox App
      </Box>
    </Group>
  );
};
