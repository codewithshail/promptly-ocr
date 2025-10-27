"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Bot, User, ZoomIn, ZoomOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { ChatMessage } from "@/app/(dashboard)/chatbot/page";
import { useTextSelection } from "@/hooks/use-text-selection";
import { SendToNotesButton } from "@/components/send-to-notes-button";
import { SendToNotesDialog } from "@/components/send-to-notes-dialog";

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function ChatMessageList({ messages, isLoading }: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const textSelection = useTextSelection();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  // Handle escape key to close lightbox
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedImage) {
        handleCloseLightbox();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedImage]);

  const handleCloseLightbox = () => {
    setSelectedImage(null);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Start a conversation</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ask me anything about UPSC preparation, current affairs, or exam
              strategies. I'm here to help you succeed!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Send to Notes Button */}
      {textSelection && !selectedImage && (
        <SendToNotesButton
          x={textSelection.x}
          y={textSelection.y}
          onClick={() => setShowNotesDialog(true)}
        />
      )}

      {/* Send to Notes Dialog */}
      <SendToNotesDialog
        open={showNotesDialog}
        onOpenChange={setShowNotesDialog}
        selectedText={textSelection?.text || ""}
        sourceType="chat"
      />

      <div className="h-full w-full overflow-y-auto" ref={scrollRef}>
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar */}
            <div className="flex-shrink-0 pt-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${
                message.role === "assistant" 
                  ? "bg-primary" 
                  : "bg-gradient-to-br from-blue-500 to-blue-600"
              }`}>
                {message.role === "assistant" ? (
                  <Bot className="w-5 h-5 text-primary-foreground" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
            </div>

            {/* Message Content */}
            <div
              className={`flex flex-col gap-2 max-w-[75%] min-w-[200px] ${
                message.role === "user" ? "items-end" : "items-start"
              }`}
            >
              {/* Display image above message text for user messages */}
              {message.role === "user" && message.image && (
                <div className="relative max-w-[300px] w-full mb-1">
                  {imageLoadingStates[message.id] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-xl">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                        <div
                          className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  )}
                  <img
                    src={message.image.url}
                    alt={message.image.alt || "Uploaded image"}
                    className="w-full h-auto rounded-xl border-2 border-border cursor-pointer hover:opacity-90 hover:border-primary/50 transition-all shadow-md"
                    style={{ maxWidth: "300px" }}
                    onClick={() => setSelectedImage(message.image!.url)}
                    onLoad={() => {
                      setImageLoadingStates((prev) => ({
                        ...prev,
                        [message.id]: false,
                      }));
                    }}
                    onLoadStart={() => {
                      setImageLoadingStates((prev) => ({
                        ...prev,
                        [message.id]: true,
                      }));
                    }}
                  />
                </div>
              )}
              
              {/* Message Bubble */}
              <Card
                className={`px-4 py-3 shadow-sm ${
                  message.role === "user"
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-600"
                    : "bg-card border-border"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown
                      components={{
                        a: ({ node, ...props }) => (
                          <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <p {...props} className="leading-relaxed" />
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                )}
              </Card>

              {/* Thinking Process */}
              {message.thinkingProcess && (
                <Card className="px-4 py-3 bg-secondary/30 border-dashed border-secondary shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Thinking Process
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {message.thinkingProcess}
                  </p>
                </Card>
              )}

              {/* Timestamp */}
              <span className="text-xs text-muted-foreground px-1">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 flex-row">
            <div className="flex-shrink-0 pt-1">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
            <Card className="px-4 py-3 bg-card border-border shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                <div
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                />
              </div>
            </Card>
          </div>
        )}
        </div>

        {/* Image Lightbox Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && handleCloseLightbox()}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
          <div className="relative w-full h-full flex flex-col">
            {/* Control Bar */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-2 shadow-lg">
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <div className="flex items-center px-3 text-sm font-medium">
                {Math.round(zoomLevel * 100)}%
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCloseLightbox}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Image Container */}
            <div
              className="flex-1 flex items-center justify-center overflow-hidden bg-black/50 p-8"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: zoomLevel > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
            >
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="Full size view"
                  className="max-w-full max-h-full object-contain select-none"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                    transition: isDragging ? "none" : "transform 0.2s ease-out",
                  }}
                  draggable={false}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}
