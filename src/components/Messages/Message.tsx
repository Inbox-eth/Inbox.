import React from "react";
import { Box } from "@mantine/core";
import type { Client, DecodedMessage } from "@xmtp/browser-sdk";
import { useNavigate, useOutletContext } from "react-router";
import classes from "./Message.module.css";
import { MessageContent } from "./MessageContent";

export type MessageProps = {
  message: DecodedMessage;
  scrollToMessage: (id: string) => void;
};

export const Message: React.FC<MessageProps> = React.memo(({
  message,
  scrollToMessage,
}) => {
  // Log when this component renders, with stack trace
  console.log(`[RENDER] Message component for id: ${message.id}`);
  // Uncomment the next line for a stack trace if needed:
  // console.trace(`[RENDER TRACE] Message component for id: ${message.id}`);
  const { client } = useOutletContext<{ client: Client }>();
  const isSender = client.inboxId === message.senderInboxId;
  const align = isSender ? "right" : "left";
  const navigate = useNavigate();
  return (
    <Box
      tabIndex={0}
      className={classes.root}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          void navigate(
            `/conversations/${message.conversationId}/message/${message.id}`,
          );
        }
      }}
      onClick={() =>
        void navigate(
          `/conversations/${message.conversationId}/message/${message.id}`,
        )
      }>
      <MessageContent
        message={message}
        align={align}
        senderInboxId={message.senderInboxId}
        scrollToMessage={scrollToMessage}
      />
    </Box>
  );
}, (prevProps, nextProps) => {
  const same = prevProps.message.id === nextProps.message.id && prevProps.scrollToMessage === nextProps.scrollToMessage;
  if (!same) {
    console.log('[Message.memo] Re-render: ', {
      prevId: prevProps.message.id,
      nextId: nextProps.message.id,
      prevScroll: prevProps.scrollToMessage,
      nextScroll: nextProps.scrollToMessage
    });
  }
  return same;
});
