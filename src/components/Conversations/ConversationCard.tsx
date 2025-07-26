import { Box, Card, Flex, Stack, Text, Tooltip, ActionIcon, Popover } from "@mantine/core";
import { IconCopy, IconExternalLink } from "@tabler/icons-react";
import { type Conversation, type Dm, type Group } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { ContentTypes } from "@/contexts/XMTPContext";
import { useXMTP } from "@/contexts/XMTPContext";
import { shortAddress } from "@/helpers/strings";
import styles from "./ConversationCard.module.css";
import { useClipboard } from '@mantine/hooks';

const isGroupConversation = (
  conversation: Conversation<ContentTypes>,
): conversation is Group<ContentTypes> => {
  return conversation.metadata?.conversationType === "group";
};

const isDmConversation = (
  conversation: Conversation<ContentTypes>,
): conversation is Dm<ContentTypes> => {
  return conversation.metadata?.conversationType === "dm";
};

const AddressWithActions: React.FC<{ address: string }> = ({ address }) => {
  const clipboard = useClipboard({ timeout: 1200 });
  return (
    <Flex align="center" gap={4}>
      <Text size="xs" style={{ fontFamily: 'monospace', fontSize: 14 }}>{address}</Text>
      <Tooltip label={clipboard.copied ? "Copied!" : "Copy"} withArrow>
        <ActionIcon
          size="xs"
          variant="subtle"
          aria-label="Copy address"
          onClick={() => clipboard.copy(address)}
        >
          <IconCopy size={14} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="More info" withArrow>
        <ActionIcon
          size="xs"
          variant="subtle"
          aria-label="More info"
          component="a"
          href={`https://address.vision/${address}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconExternalLink size={14} />
        </ActionIcon>
      </Tooltip>
    </Flex>
  );
};

const GroupChatTooltip = ({ conversation, members }: { conversation: Group<ContentTypes>, members: any[] }) => {
  const memberAddresses = members
    .filter(member => member.accountIdentifiers.length > 0)
    .map(member => member.accountIdentifiers[0].identifier);
  
  return (
    <Stack gap="xs">
      <Text fw={700} size="sm">
        {conversation.name || "Untitled"}
      </Text>
      {conversation.description && (
        <Text size="xs" c="dimmed">
          {conversation.description}
        </Text>
      )}
      <Stack gap="2px">
        {memberAddresses.map((address, index) => (
          <AddressWithActions key={index} address={address} />
        ))}
      </Stack>
    </Stack>
  );
};

export type ConversationCardProps = {
  conversation: Conversation<ContentTypes>;
};

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
}) => {
  const [memberCount, setMemberCount] = useState(0);
  const [name, setName] = useState("");
  const [peerAddress, setPeerAddress] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { client } = useXMTP();
  const [popoverOpened, setPopoverOpened] = useState(false);

  useEffect(() => {
    void conversation.members().then((membersList) => {
      setMemberCount(membersList.length);
      setMembers(membersList);
      
      // For DM conversations, get the peer's address
      if (isDmConversation(conversation) && membersList.length === 2) {
        // Find the member that is not the current user
        const peerMember = membersList.find(member => 
          member.accountIdentifiers.length > 0 && 
          member.accountIdentifiers[0].identifier !== client?.accountIdentifier?.identifier
        );
        if (peerMember && peerMember.accountIdentifiers.length > 0) {
          setPeerAddress(peerMember.accountIdentifiers[0].identifier);
        }
      }
    });
  }, [conversation, client?.accountIdentifier?.identifier]);

  useEffect(() => {
    if (isGroupConversation(conversation)) {
      setName(conversation.name ?? "");
    }
    if (isDmConversation(conversation)) {
      // For DM conversations, always show the peer's address
      if (peerAddress) {
        setName(shortAddress(peerAddress));
      } else {
        // If we don't have the peer address yet, show "Loading..."
        setName("Loading...");
      }
    }
  }, [conversation.id, peerAddress]);

  const renderGroupMembers = () => {
    if (members.length <= 3) {
      return members
        .filter(member => member.accountIdentifiers.length > 0)
        .map(member => shortAddress(member.accountIdentifiers[0].identifier))
        .join(", ");
    } else {
      const firstThree = members
        .filter(member => member.accountIdentifiers.length > 0)
        .slice(0, 3)
        .map(member => shortAddress(member.accountIdentifiers[0].identifier));
      return `${firstThree.join(", ")} (...)`;
    }
  };

  const renderContent = () => {
    if (isGroupConversation(conversation)) {
      return (
        <Stack gap="0">
          <Flex align="center">
            <Text fw={700} truncate>
              {name || "Untitled"}
            </Text>
          </Flex>
          <Text size="sm">
            {renderGroupMembers()}
          </Text>
        </Stack>
      );
    } else {
      return (
        <Stack gap="0">
          <Text size="xs" c="dimmed" style={{ textTransform: "lowercase" }}>
            1:1 Chat with:
          </Text>
          <Text fw={700} truncate>
            {name || "Unknown"}
          </Text>
        </Stack>
      );
    }
  };

  return (
    <Box px="sm">
      {isGroupConversation(conversation) ? (
        <Popover
          width="auto"
          position="right"
          withArrow
          shadow="md"
          opened={popoverOpened}
          onClose={() => setPopoverOpened(false)}
          trapFocus={false}
          offset={-5}
          transitionProps={{ transition: 'pop', duration: 100 }}
        >
          <Popover.Target>
            <div
              onMouseEnter={() => setPopoverOpened(true)}
              onMouseLeave={() => setPopoverOpened(false)}
            >
              <Card
                shadow="sm"
                padding="sm"
                radius="md"
                withBorder
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void navigate(`/conversations/${conversation.id}`);
                  }
                }}
                onClick={() => void navigate(`/conversations/${conversation.id}`)}
                className={[
                  styles.root,
                  conversation.id === conversationId && styles.selected,
                ].join(" ")}
              >
                {renderContent()}
              </Card>
            </div>
          </Popover.Target>
          <Popover.Dropdown
            p="sm"
            styles={{ dropdown: { borderRadius: 'var(--mantine-radius-md)' } }}
            onMouseEnter={() => setPopoverOpened(true)}
            onMouseLeave={() => setPopoverOpened(false)}
          >
            <GroupChatTooltip conversation={conversation} members={members} />
          </Popover.Dropdown>
        </Popover>
      ) : (
        <Popover
          width="auto"
          position="right"
          withArrow
          shadow="md"
          opened={popoverOpened}
          onClose={() => setPopoverOpened(false)}
          trapFocus={false}
          offset={-5}
          transitionProps={{ transition: 'pop', duration: 100 }}
        >
          <Popover.Target>
            <div
              onMouseEnter={() => setPopoverOpened(true)}
              onMouseLeave={() => setPopoverOpened(false)}
            >
              <Card
                shadow="sm"
                padding="sm"
                radius="md"
                withBorder
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void navigate(`/conversations/${conversation.id}`);
                  }
                }}
                onClick={() => void navigate(`/conversations/${conversation.id}`)}
                className={[
                  styles.root,
                  conversation.id === conversationId && styles.selected,
                ].join(" ")}
              >
                {renderContent()}
              </Card>
            </div>
          </Popover.Target>
          <Popover.Dropdown
            p="sm"
            styles={{ dropdown: { borderRadius: 'var(--mantine-radius-md)' } }}
            onMouseEnter={() => setPopoverOpened(true)}
            onMouseLeave={() => setPopoverOpened(false)}
          >
            <span>
              <span style={{ display: 'block', color: '#64748b', fontSize: 12, marginBottom: 2 }}>1:1 Chat with:</span>
              {peerAddress && <AddressWithActions address={peerAddress} />}
            </span>
          </Popover.Dropdown>
        </Popover>
      )}
    </Box>
  );
};
