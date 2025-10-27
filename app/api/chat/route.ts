import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { geminiService, ImageInput } from "@/lib/services/gemini.service";
import { chatService } from "@/lib/services/chat.service";
import { UPSC_CHATBOT_SYSTEM_INSTRUCTION } from "@/lib/config/evaluation-prompts";
import { handleNetworkError, formatErrorForLogging } from "@/lib/error-handler";
import { analyticsService } from "@/lib/services/analytics.service";

/**
 * Request body interface for chat API
 */
interface ChatRequestBody {
  message: string;
  thinkingMode?: boolean;
  sessionId?: string;
  image?: {
    url?: string;
    base64?: string;
    mimeType: string;
  };
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ChatRequestBody = await request.json();
    const { message, thinkingMode, sessionId, image } = body;

    // Validate message
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Validate image data if provided
    if (image) {
      if (!image.mimeType) {
        return NextResponse.json(
          { error: "Image mimeType is required" },
          { status: 400 }
        );
      }

      if (!image.url && !image.base64) {
        return NextResponse.json(
          { error: "Either image URL or base64 data is required" },
          { status: 400 }
        );
      }

      // Validate mimeType
      const validMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!validMimeTypes.includes(image.mimeType.toLowerCase())) {
        return NextResponse.json(
          {
            error: `Unsupported image format: ${image.mimeType}. Supported formats: JPG, PNG, WEBP, GIF`,
          },
          { status: 400 }
        );
      }
    }

    // Get or create session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = await chatService.createSession(userId);
    }

    // Load conversation context (last 10 messages + summary if applicable)
    const context = await chatService.getConversationContext(
      userId,
      currentSessionId
    );

    // Save user message to Redis (with image reference if provided)
    await chatService.saveMessage(userId, currentSessionId, {
      role: "user",
      content: message,
      image: image
        ? {
            url: image.url || "",
            mimeType: image.mimeType,
          }
        : undefined,
    });

    // Format conversation context for Gemini API
    let contextPrompt = "";
    if (context.summary) {
      contextPrompt += `[Previous conversation summary: ${context.summary}]\n\n`;
    }
    if (context.messages.length > 0) {
      contextPrompt += "Recent conversation:\n";
      context.messages.forEach((msg) => {
        contextPrompt += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`;
        if (msg.image) {
          contextPrompt += `[User attached an image]\n`;
        }
      });
      contextPrompt += "\n";
    }

    // Combine context with new message
    const fullMessage = contextPrompt
      ? `${contextPrompt}Current message:\nUser: ${message}`
      : message;

    // Get AI response based on thinking mode and image presence
    let response: string;
    let thinkingProcess: string | undefined;

    if (image) {
      // Handle image-based chat
      const imageInput: ImageInput = {
        url: image.url,
        base64: image.base64,
        mimeType: image.mimeType,
      };

      if (thinkingMode) {
        const result = await geminiService.chatWithImageAndThinking(
          fullMessage,
          imageInput,
          {
            enableWebSearch: true,
          },
          UPSC_CHATBOT_SYSTEM_INSTRUCTION
        );
        response = result.response;
        thinkingProcess = result.thinkingProcess;
      } else {
        response = await geminiService.chatWithImage(
          fullMessage,
          imageInput,
          {
            enableWebSearch: true,
          },
          UPSC_CHATBOT_SYSTEM_INSTRUCTION
        );
      }
    } else {
      // Handle text-only chat
      if (thinkingMode) {
        const result = await geminiService.chatWithThinking(
          fullMessage,
          {
            enableWebSearch: true,
          },
          UPSC_CHATBOT_SYSTEM_INSTRUCTION
        );
        response = result.response;
        thinkingProcess = result.thinkingProcess;
      } else {
        response = await geminiService.chat(
          fullMessage,
          {
            enableWebSearch: true,
          },
          UPSC_CHATBOT_SYSTEM_INSTRUCTION
        );
      }
    }

    // Save assistant message to Redis with AI title generation
    await chatService.saveMessage(
      userId,
      currentSessionId,
      {
        role: "assistant",
        content: response,
        thinkingProcess,
      },
      true // Generate AI title after first exchange
    );

    // Track chat activity (updates streak)
    analyticsService.trackActivity(userId, "chat_message", {
      sessionId: currentSessionId,
      hasImage: !!image,
      thinkingMode: !!thinkingMode,
    }).catch((error) => {
      console.error("Failed to track chat activity:", error);
    });

    // Trigger summary generation if needed (> 20 messages = 10 pairs)
    if (context.totalMessages >= 20 && !context.summary) {
      // Generate summary asynchronously (don't await to avoid blocking response)
      chatService
        .generateMessageSummary(userId, currentSessionId)
        .catch((error) => {
          console.error("Failed to generate summary:", error);
        });
    }

    // Return response with session metadata and context information
    return NextResponse.json({
      response,
      thinkingProcess,
      webSearchEnabled: true,
      sessionId: currentSessionId,
      context: {
        totalMessages: context.totalMessages + 2, // +2 for the messages we just added
        hasSummary: !!context.summary,
        recentMessageCount: context.messages.length,
      },
    });
  } catch (error) {
    console.error("Chat API error:", formatErrorForLogging(error));

    const errorResponse = handleNetworkError(error);

    return NextResponse.json(
      {
        error: errorResponse.message,
        code: errorResponse.code,
      },
      { status: 500 }
    );
  }
}
