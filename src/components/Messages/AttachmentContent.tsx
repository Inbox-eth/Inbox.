import { Box, Button, Group, Text, Image, Paper } from "@mantine/core";
import { IconDownload, IconFile, IconPhoto } from "@tabler/icons-react";
import type { RemoteAttachment } from "@xmtp/content-type-remote-attachment";
import { useState, useEffect } from "react";
import { RemoteAttachmentCodec, AttachmentCodec } from "@xmtp/content-type-remote-attachment";
import { ContentTypeAttachment, AttachmentCodec as AttachmentCodecType } from "@xmtp/content-type-remote-attachment";
import { ContentTypeId } from "@xmtp/content-type-primitives";

export type AttachmentContentProps = {
  attachment: RemoteAttachment;
};

export const AttachmentContent: React.FC<AttachmentContentProps> = ({
  attachment,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [decryptedMimeType, setDecryptedMimeType] = useState<string | null>(null);

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

  console.log('isImage', isImage);
  console.log('isVideo', isVideo);
  console.log('isAudio', isAudio);

  useEffect(() => {
    let cancelled = false;
    const tryAutoPreview = async () => {
      setIsLoading(true);
      try {
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
        // ignore
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
    try {
      // Use RemoteAttachmentCodec.load to decrypt
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
    } catch (error) {
      console.error("Failed to download attachment:", error);
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
    <Paper p="md" withBorder>
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
        
        <Group gap="xs">
          {isImage && (
            <Button
              size="xs"
              variant="light"
              onClick={handlePreview}
              loading={isLoading}
            >
              Preview
            </Button>
          )}
          <Button
            size="xs"
            variant="light"
            onClick={handleDownload}
            loading={isLoading}
            leftSection={<IconDownload size={14} />}
          >
            Download
          </Button>
        </Group>
      </Group>

      {previewUrl && isImage && (
        <Box mt="sm" style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #eee', background: '#fafbfc', maxWidth: 320, maxHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Image
            src={previewUrl}
            alt={attachment.filename || "Attachment preview"}
            radius="sm"
            style={{ maxHeight: 220, maxWidth: 300, objectFit: "contain" }}
          />
        </Box>
      )}
      {previewUrl && isVideo && (
        <Box mt="sm" style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #eee', background: '#fafbfc', maxWidth: 320, maxHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <video
            src={previewUrl}
            controls
            style={{ maxHeight: 220, maxWidth: 300, objectFit: "contain" }}
          />
        </Box>
      )}
      {previewUrl && isAudio && (
        <Box mt="sm" style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #eee', background: '#fafbfc', maxWidth: 320, maxHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <audio
            src={previewUrl}
            controls
            style={{ width: 300 }}
          />
        </Box>
      )}
    </Paper>
  );
}; 