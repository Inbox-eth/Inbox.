import type {
  Conversation,
  DecodedMessage,
  SafeListMessagesOptions,
} from "@xmtp/browser-sdk";
import {
  ContentTypeRemoteAttachment,
  RemoteAttachmentCodec,
  AttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { useState } from "react";
import { useXMTP, type ContentTypes } from "@/contexts/XMTPContext";

async function uploadToServer(buffer: ArrayBuffer, filename: string): Promise<string> {
  try {
    // Create a File object from the buffer
    const file = new File([buffer], filename);
    
    // Create FormData and upload to our server
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload-attachment', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload file');
    }
    
    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error('Failed to upload file:', error);
    throw new Error('Failed to upload file to server');
  }
}

export const useConversation = (conversation?: Conversation<ContentTypes>) => {
  const { client } = useXMTP();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<DecodedMessage<ContentTypes>[]>([]);

  const getMessages = async (
    options?: SafeListMessagesOptions,
    syncFromNetwork: boolean = false,
  ) => {
    if (!client) {
      return;
    }

    setMessages([]);
    setLoading(true);

    if (syncFromNetwork) {
      await sync();
    }

    try {
      const msgs = (await conversation?.messages(options)) ?? [];
      setMessages(msgs);
      return msgs;
    } finally {
      setLoading(false);
    }
  };

  const sync = async () => {
    if (!client) {
      return;
    }

    setSyncing(true);

    try {
      await conversation?.sync();
    } finally {
      setSyncing(false);
    }
  };

  const send = async (message: string) => {
    if (!client) {
      return;
    }

    setSending(true);

    try {
      await conversation?.send(message);
    } finally {
      setSending(false);
    }
  };

  const sendAttachment = async (file: File, message?: string) => {
    if (!client || !conversation) {
      return;
    }

    setSending(true);

    try {
      // Convert file to Uint8Array
      const data = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result instanceof ArrayBuffer) {
            resolve(reader.result);
          } else {
            reject(new Error("Not an ArrayBuffer"));
          }
        };
        reader.readAsArrayBuffer(file);
      });

      const attachment = {
        filename: file.name,
        mimeType: file.type,
        data: new Uint8Array(data),
      };

      // Encrypt the attachment
      const encryptedEncoded = await RemoteAttachmentCodec.encodeEncrypted(
        attachment,
        new AttachmentCodec()
      );

      // Upload encrypted file to server (which uploads to IPFS) and get public URL
      const url = await uploadToServer(encryptedEncoded.payload.buffer as ArrayBuffer, file.name);

      const remoteAttachment = {
        url,
        contentDigest: encryptedEncoded.digest,
        salt: encryptedEncoded.salt,
        nonce: encryptedEncoded.nonce,
        secret: encryptedEncoded.secret,
        scheme: "https://", // IPFS URLs are always HTTPS
        filename: attachment.filename,
        contentLength: attachment.data.byteLength,
        mimeType: attachment.mimeType,
      };

      console.log('remoteAttachment', remoteAttachment);

      await conversation.send(remoteAttachment, ContentTypeRemoteAttachment);

      // If there's a message, send it as a separate text message
      if (message && message.trim()) {
        await conversation.send(message);
      }
    } catch (error) {
      console.error("Failed to send attachment:", error);
      throw error;
    } finally {
      setSending(false);
    }
  };

  const streamMessages = async () => {
    const noop = () => {};
    if (!client) {
      return noop;
    }

    const onMessage = (
      error: Error | null,
      message: DecodedMessage<ContentTypes> | undefined,
    ) => {
      if (message) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const stream = await conversation?.stream(onMessage);

    return stream
      ? () => {
          void stream.return(undefined);
        }
      : noop;
  };

  return {
    getMessages,
    loading,
    messages,
    send,
    sendAttachment,
    sending,
    streamMessages,
    sync,
    syncing,
  };
};
