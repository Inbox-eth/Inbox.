import React from "react";
import { Box, Group, Text, Image } from "@mantine/core";
import { IconDownload, IconFile, IconPhoto } from "@tabler/icons-react";
import type { RemoteAttachment } from "@xmtp/content-type-remote-attachment";
import { useState, useEffect } from "react";
import { RemoteAttachmentCodec, AttachmentCodec } from "@xmtp/content-type-remote-attachment";
import { ContentTypeAttachment, AttachmentCodec as AttachmentCodecType } from "@xmtp/content-type-remote-attachment";
import { ContentTypeId } from "@xmtp/content-type-primitives";
import classes from "./AttachmentContent.module.css";

export type AttachmentContentProps = {
  attachment: RemoteAttachment;
};

// Utility to fetch with retry for IPFS propagation delays
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
    } catch (e) {
      // ignore
    }
    if (i < retries - 1) await new Promise(res => setTimeout(res, delay));
  }
  throw new Error('File not available on IPFS gateway after several attempts');
}

export const AttachmentContent: React.FC<AttachmentContentProps> = React.memo(({
  attachment,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [decryptedMimeType, setDecryptedMimeType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Minimal CodecRegistry for attachments
  const attachmentCodec = new AttachmentCodecType();
  const codecRegistry = {
    codecFor: (contentType: ContentTypeId) => {
      if (contentType.sameAs(ContentTypeAttachment)) {
        return attachmentCodec;
      }
      return undefined;
    },
  };

  // Helper to check type after decryption
  const isImage = decryptedMimeType?.startsWith('image/');
  const isVideo = decryptedMimeType?.startsWith('video/');
  const isAudio = decryptedMimeType?.startsWith('audio/');

  useEffect(() => {
    let cancelled = false;
    setError(null);
    const tryAutoPreview = async () => {
      setIsLoading(true);
      try {
        const response = await fetchWithRetry(attachment.url);
        const encryptedBuffer = await response.arrayBuffer();
        const decrypted = await RemoteAttachmentCodec.load(attachment, codecRegistry) as any;
        if (cancelled) return;
        setDecryptedMimeType(decrypted.mimeType);
        if (
          decrypted.mimeType?.startsWith("image/") ||
          decrypted.mimeType?.startsWith("video/") ||
          decrypted.mimeType?.startsWith("audio/")
        ) {
          const blob = new Blob([decrypted.data], { type: decrypted.mimeType });
          const url = window.URL.createObjectURL(blob);
          setPreviewUrl(url);
        }
      } catch (e) {
        if (!cancelled) setError('File is still propagating on the IPFS network. Please try again in a few seconds.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    tryAutoPreview();
    return () => {
      cancelled = true;
      if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line
  }, [attachment.url, attachment.contentDigest]);

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchWithRetry(attachment.url);
      const encryptedBuffer = await response.arrayBuffer();
      const decrypted = await RemoteAttachmentCodec.load(attachment, codecRegistry) as any;
      setDecryptedMimeType(decrypted.mimeType);
      const blob = new Blob([decrypted.data], { type: decrypted.mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.filename || "attachment";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError('File is still propagating on the IPFS network. Please try again in a few seconds.');
      console.error("Failed to download attachment:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async () => {
    if (previewUrl) return;
    setIsLoading(true);
    try {
      // Use RemoteAttachmentCodec.load to decrypt
      const decrypted = await RemoteAttachmentCodec.load(attachment, codecRegistry) as any;
      setDecryptedMimeType(decrypted.mimeType);
      const blob = new Blob([decrypted.data], { type: decrypted.mimeType });
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Failed to load preview:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = () => {
    if (isImage) return <IconPhoto size={20} />;
    if (isVideo) return <IconFile size={20} />;
    if (isAudio) return <IconFile size={20} />;
    return <IconFile size={20} />;
  };

  return (
    <Box className={classes.container}>
      <Group justify="space-between" align="center">
        <Group gap="sm">
          {getFileIcon()}
          <Box>
            <Text size="sm" fw={500}>
              {attachment.filename || "Attachment"}
            </Text>
            <Text size="xs" c="dimmed">
              {formatFileSize(attachment.contentLength)} • {(attachment as any).mimeType || 'unknown'}
            </Text>
          </Box>
        </Group>
        <Group>
          <button
            className={classes.downloadButton}
            style={{ opacity: isLoading ? 0.7 : 1 }}
            onClick={handleDownload}
            disabled={isLoading}
          >
            <IconDownload size={14} />
          </button>
        </Group>
      </Group>

      {error && (
        <Text className={classes.error}>{error}</Text>
      )}

      {previewUrl && isImage && (
        <Box mt="sm" className={classes.previewContainer}>
          <Image
            src={previewUrl}
            alt={attachment.filename || "Attachment preview"}
            radius="sm"
            style={{ maxHeight: 220, maxWidth: 300, objectFit: "contain" }}
          />
        </Box>
      )}
      {previewUrl && isVideo && (
        <Box mt="sm" className={classes.videoContainer}>
          <video
            src={previewUrl}
            controls
            style={{ maxHeight: 220, maxWidth: 300, objectFit: "contain" }}
          />
        </Box>
      )}
      {previewUrl && isAudio && (
        <Box mt="sm" className={classes.audioContainer}>
          <audio
            src={previewUrl}
            controls
            style={{ width: 300 }}
          />
        </Box>
      )}
    </Box>
  );
}, (prevProps, nextProps) => {
  const same = prevProps.attachment.url === nextProps.attachment.url && prevProps.attachment.contentDigest === nextProps.attachment.contentDigest;
  if (!same) {
    console.log('[AttachmentContent.memo] Re-render: ', {
      prevUrl: prevProps.attachment.url,
      nextUrl: nextProps.attachment.url,
      prevDigest: prevProps.attachment.contentDigest,
      nextDigest: nextProps.attachment.contentDigest
    });
  }
  return same;
}); 