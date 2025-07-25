import React from "react";
import { Code } from "@mantine/core";
import type { DecodedMessage } from "@xmtp/browser-sdk";
import {
  ContentTypeGroupUpdated,
  type GroupUpdated,
} from "@xmtp/content-type-group-updated";
import { ContentTypeReply, type Reply } from "@xmtp/content-type-reply";
import {
  ContentTypeTransactionReference,
  type TransactionReference,
} from "@xmtp/content-type-transaction-reference";
import {
  ContentTypeWalletSendCalls,
  type WalletSendCallsParams,
} from "@xmtp/content-type-wallet-send-calls";
import {
  ContentTypeRemoteAttachment,
  type RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { AttachmentContent } from "@/components/Messages/AttachmentContent";
import { FallbackContent } from "@/components/Messages/FallbackContent";
import { GroupUpdatedContent } from "@/components/Messages/GroupUpdatedContent";
import {
  MessageContentWrapper,
  type MessageContentAlign,
} from "@/components/Messages/MessageContentWrapper";
import { ReplyContent } from "@/components/Messages/ReplyContent";
import { TextContent } from "@/components/Messages/TextContent";
import { TransactionReferenceContent } from "@/components/Messages/TransactionReferenceContent";
import { WalletSendCallsContent } from "@/components/Messages/WalletSendCallsContent";

export type MessageContentProps = {
  align: MessageContentAlign;
  senderInboxId: string;
  message: DecodedMessage;
  scrollToMessage: (id: string) => void;
};

export const MessageContent: React.FC<MessageContentProps> = React.memo(({
  message,
  align,
  senderInboxId,
  scrollToMessage,
}) => {
  if (message.contentType.sameAs(ContentTypeTransactionReference)) {
    return (
      <MessageContentWrapper
        align={align}
        senderInboxId={senderInboxId}
        sentAtNs={message.sentAtNs}>
        <TransactionReferenceContent
          content={message.content as TransactionReference}
        />
      </MessageContentWrapper>
    );
  }

  if (message.contentType.sameAs(ContentTypeWalletSendCalls)) {
    return (
      <MessageContentWrapper
        align={align}
        senderInboxId={senderInboxId}
        sentAtNs={message.sentAtNs}>
        <WalletSendCallsContent
          content={message.content as WalletSendCallsParams}
          conversationId={message.conversationId}
        />
      </MessageContentWrapper>
    );
  }

  if (message.contentType.sameAs(ContentTypeGroupUpdated)) {
    return (
      <GroupUpdatedContent
        content={message.content as GroupUpdated}
        sentAtNs={message.sentAtNs}
      />
    );
  }

  if (message.contentType.sameAs(ContentTypeReply)) {
    return (
      <MessageContentWrapper
        align={align}
        senderInboxId={senderInboxId}
        sentAtNs={message.sentAtNs}>
        <ReplyContent
          align={align}
          message={message as DecodedMessage<Reply>}
          scrollToMessage={scrollToMessage}
        />
      </MessageContentWrapper>
    );
  }

  if (message.contentType.sameAs(ContentTypeRemoteAttachment)) {
    return (
      <MessageContentWrapper
        align={align}
        senderInboxId={senderInboxId}
        sentAtNs={message.sentAtNs}>
        <AttachmentContent
          attachment={message.content as RemoteAttachment}
        />
      </MessageContentWrapper>
    );
  }

  if (
    message.contentType?.authorityId === "xmtp.org" &&
    message.contentType?.typeId === "text"
  ) {
    return (
      <MessageContentWrapper
        align={align}
        senderInboxId={senderInboxId}
        sentAtNs={message.sentAtNs}
      >
        <TextContent text={message.content as string} />
      </MessageContentWrapper>
    );
  }

  if (typeof message.content === "string") {
    return (
      <MessageContentWrapper
        align={align}
        senderInboxId={senderInboxId}
        sentAtNs={message.sentAtNs}>
        <TextContent text={message.content} />
      </MessageContentWrapper>
    );
  }

  if (typeof message.fallback === "string") {
    return (
      <MessageContentWrapper
        align={align}
        senderInboxId={senderInboxId}
        sentAtNs={message.sentAtNs}>
        <FallbackContent text={message.fallback} />
      </MessageContentWrapper>
    );
  }

  return (
    <MessageContentWrapper
      align={align}
      senderInboxId={senderInboxId}
      sentAtNs={message.sentAtNs}>
      <Code
        block
        w="100%"
        style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
        {JSON.stringify(message.content ?? message.fallback, null, 2)}
      </Code>
    </MessageContentWrapper>
  );
}, (prevProps, nextProps) => {
  const same = prevProps.message.id === nextProps.message.id && prevProps.align === nextProps.align && prevProps.senderInboxId === nextProps.senderInboxId && prevProps.scrollToMessage === nextProps.scrollToMessage;
  if (!same) {
    console.log('[MessageContent.memo] Re-render: ', {
      prevId: prevProps.message.id,
      nextId: nextProps.message.id,
      prevAlign: prevProps.align,
      nextAlign: nextProps.align,
      prevSender: prevProps.senderInboxId,
      nextSender: nextProps.senderInboxId,
      prevScroll: prevProps.scrollToMessage,
      nextScroll: nextProps.scrollToMessage
    });
  }
  return same;
});
