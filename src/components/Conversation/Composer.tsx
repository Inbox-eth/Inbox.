import { Button, Group, TextInput, ActionIcon, Box, Text } from "@mantine/core";
import { IconPaperclip, IconX } from "@tabler/icons-react";
import type { Conversation } from "@xmtp/browser-sdk";
import { useRef, useState, useEffect } from "react";
import type { ContentTypes } from "@/contexts/XMTPContext";
import { useConversation } from "@/hooks/useConversation";
import classes from "./Composer.module.css";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/*",
  "video/*", 
  "audio/*",
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".zip",
  ".rar"
];

export type ComposerProps = {
  conversation: Conversation<ContentTypes>;
};

export const Composer: React.FC<ComposerProps> = ({ conversation }) => {
  const { send, sendAttachment, sending } = useConversation(conversation);
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    
    const isValidType = ALLOWED_TYPES.some(type => {
      if (type.endsWith("/*")) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.name.toLowerCase().endsWith(type);
    });
    
    if (!isValidType) {
      return "File type not supported";
    }
    
    return null;
  };

  const handleSend = async () => {
    if ((message.length === 0 && !selectedFile) || sending) {
      return;
    }

    try {
      if (selectedFile) {
        await sendAttachment(selectedFile, message);
        setSelectedFile(null);
        setFileError(null);
      } else {
        await send(message);
      }
      
      setMessage("");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } catch (error) {
      console.error("Failed to send message:", error);
      // You could add a toast notification here
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        setFileError(error);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      
      setFileError(null);
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Type detection for preview
  const mimeType = selectedFile?.type || "";
  const isImage = mimeType.startsWith("image/");
  const isVideo = mimeType.startsWith("video/");
  const isAudio = mimeType.startsWith("audio/");

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        setFileError(error);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      setFileError(null);
      setSelectedFile(file);
    }
  };

  return (
    <Box
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: '100%',
        border: isDragActive ? "2px dashed var(--mantine-color-blue-5)" : undefined,
        background: isDragActive ? "var(--mantine-color-blue-0)" : undefined,
        borderRadius: 8,
        transition: "border 0.2s, background 0.2s",
      }}
    >
      {fileError && (
        <Box p="xs" bg="red.0" style={{ borderBottom: "1px solid var(--mantine-color-red-3)" }}>
          <Text size="sm" c="red">
            {fileError}
          </Text>
        </Box>
      )}
      
      {selectedFile && previewUrl && (
        <Box p="xs" bg="gray.0" style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}>
          {isImage && (
            <img src={previewUrl} alt="preview" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8 }} />
          )}
          {isVideo && (
            <video src={previewUrl} controls style={{ maxWidth: 300, maxHeight: 200, borderRadius: 8 }} />
          )}
          {isAudio && (
            <audio src={previewUrl} controls style={{ width: 300 }} />
          )}
        </Box>
      )}
      
      {selectedFile && (
        <Box p="xs" bg="gray.0" style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}>
          <Group justify="space-between" align="center">
            <Group gap="sm">
              <IconPaperclip size={16} />
              <Box>
                <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                  {selectedFile.name}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--mantine-color-gray-6)" }}>
                  {formatFileSize(selectedFile.size)} • {selectedFile.type || "Unknown type"}
                </div>
              </Box>
            </Group>
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={handleRemoveFile}
              color="gray"
            >
              <IconX size={14} />
            </ActionIcon>
          </Group>
        </Box>
      )}
      
      <Group
        align="center"
        gap="xs"
        wrap="nowrap"
        p="md"
        className={classes.root}
        style={{ width: '100%' }}
      >
        <ActionIcon
          size="lg"
          variant="subtle"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          title="Attach file"
        >
          <IconPaperclip size={20} />
        </ActionIcon>
        
        <TextInput
          ref={inputRef}
          disabled={sending}
          size="md"
          placeholder={selectedFile ? "Add a message (optional)..." : "Type a message..."}
          style={{ flex: 1, width: '100%' }}
          value={message}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
        />
        
        <Button
          disabled={(message.length === 0 && !selectedFile) || sending}
          loading={sending}
          size="md"
          onClick={() => void handleSend()}>
          Send
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileSelect}
          accept={ALLOWED_TYPES.join(",")}
        />
      </Group>
    </Box>
  );
};
