"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Brain, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttachmentMenuProps {
  thinkingMode: boolean;
  onThinkingModeToggle: (enabled: boolean) => void;
  onImageSelect: (file: File) => void;
  disabled?: boolean;
}

export function AttachmentMenu({
  thinkingMode,
  onThinkingModeToggle,
  onImageSelect,
  disabled = false,
}: AttachmentMenuProps) {
  const [open, setOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
    setOpen(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleThinkingModeToggle = (checked: boolean) => {
    // Prevent event propagation to avoid page reload
    onThinkingModeToggle(checked);
    // Keep popover open after toggle
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={disabled}
            className={cn(
              "h-10 w-10 rounded-full transition-all duration-200",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              open && "bg-accent text-accent-foreground"
            )}
            aria-label="Open attachment menu"
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <Plus className={cn(
              "h-5 w-5 transition-transform duration-200",
              open && "rotate-45"
            )} />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-2"
          align="start"
          side="top"
          onKeyDown={handleKeyDown}
          role="menu"
          aria-label="Attachment options"
        >
          <div className="space-y-1">
            {/* Thinking Mode Toggle */}
            <div
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-2.5",
                "hover:bg-accent transition-colors duration-150",
                "focus-within:bg-accent",
                "group"
              )}
              role="menuitem"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Thinking Mode</span>
                  <span className="text-xs text-muted-foreground">
                    Show AI reasoning process
                  </span>
                </div>
              </div>
              <Switch
                checked={thinkingMode}
                onCheckedChange={(checked) => {
                  handleThinkingModeToggle(checked);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                aria-label="Toggle thinking mode"
                className="ml-2"
              />
            </div>

            {/* Image Upload */}
            <button
              onClick={handleImageUploadClick}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2.5",
                "hover:bg-accent transition-colors duration-150",
                "focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "text-left"
              )}
              role="menuitem"
              aria-label="Upload image"
            >
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Upload Image</span>
                <span className="text-xs text-muted-foreground">
                  JPG, PNG, WEBP, GIF (max 4MB)
                </span>
              </div>
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
    </>
  );
}
