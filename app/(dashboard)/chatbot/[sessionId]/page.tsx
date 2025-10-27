"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { usePreferences } from "@/hooks/use-preferences";

import { ChatMessageList } from "@/components/chat-message-list";
import { ChatInput } from "@/components/chat-input";
import { ChatbotSkeleton } from "@/components/skeletons";
import { ChatbotErrorBoundary } from "@/components/error-boundary";
import { useToast } from "@/hooks/use-toast";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinkingProcess?: string;
  timestamp: Date;
  image?: {
    url: string;
    alt?: string;
  };
}

export default function ChatSessionPage() {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const { preferences, updatePreferences, isLoading: preferencesLoading } = usePreferences();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const isInitializedRef = useRef(false);

  const sessionId = params.sessionId as string;

  // Load thinking mode preference from user preferences (only once on mount)
  useEffect(() => {
    if (preferences && !isInitializedRef.current) {
      setIsThinkingMode(preferences.thinkingModeDefault || false);
      isInitializedRef.current = true;
    }
  }, [preferences]);

  // Save thinking mode preference when user manually changes it
  const handleThinkingModeToggle = useCallback((enabled: boolean) => {
    setIsThinkingMode(enabled);
    if (user && preferences) {
      updatePreferences({ thinkingModeDefault: enabled });
    }
  }, [user, preferences, updatePreferences]);

  // Load current session when sessionId changes
  useEffect(() => {
    if (user && sessionId) {
      setCurrentSessionId(sessionId);
      loadSession(sessionId);
    }
  }, [user, sessionId]);

  const loadSession = async (sessionId: string) => {
    try {
      setIsLoadingSession(true);
      const response = await fetch(`/api/chat/sessions/${sessionId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Session not found",
            description: "This chat session doesn't exist or has expired",
            variant: "destructive",
          });
          router.push("/chatbot");
          return;
        }
        throw new Error("Failed to load session");
      }

      const data = await response.json();
      const session = data.session;

      // Convert messages to ChatMessage format
      const loadedMessages: ChatMessage[] = session.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));

      setMessages(loadedMessages);
    } catch (error) {
      console.error("Load session error:", error);
      toast({
        title: "Error",
        description: "Failed to load chat session",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleSendMessage = async (
    content: string,
    image?: { file: File; preview: string; url?: string }
  ) => {
    if ((!content.trim() && !image) || !user) return;

    // Convert image to base64 if provided
    let imageBase64: string | undefined;
    let imageMimeType: string | undefined;
    let imageUrl: string | undefined;

    if (image) {
      try {
        // Convert File to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (e.g., "data:image/png;base64,")
            const base64Data = result.split(",")[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(image.file);
        imageBase64 = await base64Promise;
        imageMimeType = image.file.type;
        imageUrl = image.preview; // Use preview URL for display
      } catch (error) {
        console.error("Image conversion error:", error);
        toast({
          title: "Image Upload Error",
          description: "Failed to process image. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
      image: imageUrl ? { url: imageUrl } : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          thinkingMode: isThinkingMode,
          sessionId: currentSessionId,
          image:
            imageBase64 && imageMimeType
              ? {
                  base64: imageBase64,
                  mimeType: imageMimeType,
                }
              : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        thinkingProcess: data.thinkingProcess,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response. Please try again.",
        variant: "destructive",
      });
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (preferencesLoading || isLoadingSession) {
    return (
      <div className="fixed inset-y-0 right-0 left-0 md:left-64 top-16 flex flex-col bg-background">
        <div className="flex-1 overflow-hidden">
          <ChatbotSkeleton />
        </div>
      </div>
    );
  }

  return (
    <ChatbotErrorBoundary>
      <div className="fixed inset-y-0 right-0 left-0 md:left-64 top-16 flex flex-col bg-background">
        {/* Messages Area - Scrollable */}
        <div className="flex-1 overflow-hidden">
          <ChatMessageList messages={messages} isLoading={isLoading} />
        </div>
        
        {/* Input Area - Fixed at bottom */}
        <div className="flex-shrink-0 border-t bg-background">
          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading}
            thinkingMode={isThinkingMode}
            onThinkingModeToggle={handleThinkingModeToggle}
          />
        </div>
      </div>
    </ChatbotErrorBoundary>
  );
}
