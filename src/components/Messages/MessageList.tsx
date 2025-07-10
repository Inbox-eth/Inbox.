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

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  console.log("messages", messages);
  const ids = messages.map((m) => m.id);
  console.log("message ids", ids);
  // Use Array.from to ensure a new array reference, but keep DecodedMessage instances
  const messageArray = useMemo(() => Array.from(messages), [messages]);
  const virtuoso = useRef<VirtuosoHandle>(null);
  const messageMap = useMemo(() => {
    const map = new Map<string, number>();
    messageArray.forEach((message, index) => {
      map.set(message.id, index);
      console.log("message", message.id, index, message.sentAtNs, message.contentType?.authorityId, message.contentType?.typeId, message.contentType?.versionMajor, message.contentType?.versionMinor, message.content, typeof message.content);
    });
    return map;
  }, [messageArray]);
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
      initialTopMostItemIndex={messageArray.length - 1}
      data={messageArray}
      itemContent={(_, message) => {
        console.log(
          "Rendering message",
          message.id,
          message.contentType?.authorityId,
          message.contentType?.typeId,
          message.contentType?.versionMajor,
          message.contentType?.versionMinor,
          message.content,
          typeof message.content
        );
        return (
          <Message
            key={message.id || message.sentAtNs?.toString() || Math.random()}
            message={message}
            scrollToMessage={scrollToMessage}
          />
        );
      }}
    />
  );
};
