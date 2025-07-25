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

// For debugging: track last message object refs by id
const lastMessageRefs: Record<string, DecodedMessage> = {};

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  // Warn if message object reference changes for the same id
  messages.forEach((m) => {
    if (lastMessageRefs[m.id] && lastMessageRefs[m.id] !== m) {
      // Only warn if the id is the same but the object is different
      // This means the parent is recreating message objects
      // This will break memoization!
      // eslint-disable-next-line no-console
      console.warn(
        `[WARN] Message object reference changed for id: ${m.id}. This will cause unnecessary re-renders. Ensure parent keeps message objects stable.`
      );
    }
    lastMessageRefs[m.id] = m;
  });

  const virtuoso = useRef<VirtuosoHandle>(null);

  // Memoize messageMap for scrollToMessage
  const messageMap = useMemo(() => {
    const map = new Map<string, number>();
    messages.forEach((message, index) => {
      map.set(message.id, index);
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
    [messageMap]
  );

  // Memoize itemContent so it doesn't change on every render
  const itemContent = useCallback(
    (_: number, message: DecodedMessage) => {
      return (
        <Message
          key={message.id}
          message={message}
          scrollToMessage={scrollToMessage}
        />
      );
    },
    [scrollToMessage]
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
      itemContent={itemContent}
      computeItemKey={(_index, message) => message.id}
      overscan={400}
    />
  );
};
