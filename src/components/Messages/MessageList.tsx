import type { DecodedMessage } from "@xmtp/browser-sdk";
import { useCallback, useMemo, useRef, type ComponentProps } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { Message } from "./Message";
import classes from "./MessageList.module.css";
import React from "react";

const List = React.forwardRef<HTMLDivElement, ComponentProps<"div">>((props, ref) => (
  <div ref={ref} className={classes.root} {...props} />
));

export type MessageListProps = {
  messages: DecodedMessage[];
};

const renderCounts: Record<string, number> = {};
let lastMessagesRef: DecodedMessage[] | undefined = undefined;
let lastMessageRefs: Record<string, DecodedMessage> = {};

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  // Log array reference
  if (lastMessagesRef !== messages) {
    console.log('[REF] messages array reference changed');
    lastMessagesRef = messages;
  } else {
    console.log('[REF] messages array reference is stable');
  }
  // Log message object references
  messages.forEach((m) => {
    if (lastMessageRefs[m.id] !== m) {
      console.log(`[REF] message object reference changed for id: ${m.id}`);
      lastMessageRefs[m.id] = m;
    } else {
      // Only log if you want to see stability
      // console.log(`[REF] message object reference is stable for id: ${m.id}`);
    }
  });
  console.log("messages", messages);
  const ids = messages.map((m) => m.id);
  console.log("message ids", ids);
  const virtuoso = useRef<VirtuosoHandle>(null);
  const messageMap = useMemo(() => {
    const map = new Map<string, number>();
    messages.forEach((message, index) => {
      map.set(message.id, index);
      console.log("message", message.id, index, message.sentAtNs, message.contentType?.authorityId, message.contentType?.typeId, message.contentType?.versionMajor, message.contentType?.versionMinor, message.content, typeof message.content);
    });
    return map;
  }, [messages]);
  const scrollToMessage = useCallback(
    (id: string) => {
      const index = messageMap.get(id);
      if (index !== undefined) {
        virtuoso.current?.scrollToIndex(index);
      }
    },
    [messageMap],
  );
  return (
    <Virtuoso
      ref={virtuoso}
      alignToBottom
      followOutput="auto"
      style={{ flexGrow: 1 }}
      components={{
        List,
      }}
      initialTopMostItemIndex={messages.length - 1}
      data={messages}
      itemContent={(_, message) => {
        if (!renderCounts[message.id]) renderCounts[message.id] = 0;
        renderCounts[message.id] += 1;
        console.log(
          `[RENDER] message`,
          message.id,
          `render count:`, renderCounts[message.id],
          message.contentType?.authorityId,
          message.contentType?.typeId,
          message.contentType?.versionMajor,
          message.contentType?.versionMinor,
          message.content,
          typeof message.content
        );
        return (
          <Message
            key={message.id}
            message={message}
            scrollToMessage={scrollToMessage}
          />
        );
      }}
    />
  );
};
