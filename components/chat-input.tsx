"use client";

import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Send, X, Loader2 } from "lucide-react";
import { AttachmentMenu } from "@/components/attachment-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ImageAttachment {
  file: File;
  preview: string;
  url?: string;
}

interface ChatInputProps {
  onSend: (message: string, image?: ImageAttachment) => void;
  disabled?: boolean;
  thinkingMode: boolean;
  onThinkingModeToggle: (enabled: boolean) => void;
}

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

export function ChatInput({ 
  onSend, 
  disabled, 
  thinkingMode, 
  onThinkingModeToggle 
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [imageAttachment, setImageAttachment] = useState<ImageAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const validateImage = (file: File): string | null => {
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "Please upload a JPG, PNG, WEBP, or GIF image.";
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return "Image must be under 4MB. Please choose a smaller file.";
    }

    return null;
  };

  const handleImageSelect = (file: File) => {
    const error = validateImage(file);
    
    if (error) {
      toast({
        title: "Invalid Image",
        description: error,
        variant: "destructive",
      });
      return;
    }

    // Create preview URL
    const preview = URL.createObjectURL(file);
    setImageAttachment({ file, preview });
  };

  const handleRemoveImage = () => {
    if (imageAttachment?.preview) {
      URL.revokeObjectURL(imageAttachment.preview);
    }
    setImageAttachment(null);
  };

  const handleSend = async () => {
    if ((!message.trim() && !imageAttachment) || disabled || isUploading) {
      return;
    }

    try {
      setIsUploading(true);
      await onSend(message, imageAttachment || undefined);
      
      // Clear state after successful send
      setMessage("");
      if (imageAttachment?.preview) {
        URL.revokeObjectURL(imageAttachment.preview);
      }
      setImageAttachment(null);
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="bg-background">
      <div className="p-4 max-w-4xl mx-auto">
        {/* Image Preview */}
        {imageAttachment && (
          <div className="mb-3 p-2.5 border rounded-lg bg-card shadow-sm">
            <div className="flex items-start gap-2.5">
              <div className="relative w-16 h-16 rounded-md overflow-hidden border bg-muted flex-shrink-0">
                <Image
                  src={imageAttachment.preview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {imageAttachment.file.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatFileSize(imageAttachment.file.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveImage}
                disabled={isUploading}
                className="flex-shrink-0 h-7 w-7"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2 items-center">
          {/* Attachment Menu */}
          <div className="flex-shrink-0">
            <AttachmentMenu
              thinkingMode={thinkingMode}
              onThinkingModeToggle={onThinkingModeToggle}
              onImageSelect={handleImageSelect}
              disabled={disabled || isUploading}
            />
          </div>

          {/* Textarea */}
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about UPSC preparation..."
              disabled={disabled || isUploading}
              className={cn(
                "w-full h-[44px] max-h-[200px] resize-none rounded-lg",
                "border border-input bg-background",
                "px-3 py-2.5 text-sm leading-relaxed",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-0 focus:border-primary",
                "transition-all duration-150",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
              rows={1}
            />
          </div>

          {/* Send Button */}
          <div className="flex-shrink-0">
            <Button
              onClick={handleSend}
              disabled={disabled || isUploading || (!message.trim() && !imageAttachment)}
              size="icon"
              className={cn(
                "h-[44px] w-[44px] rounded-lg",
                "transition-all duration-150",
                "hover:scale-105 active:scale-95",
                "disabled:hover:scale-100"
              )}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Helper Text */}
        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </p>
          {thinkingMode && (
            <p className="text-xs text-primary font-medium">
              🧠 Thinking mode enabled
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
