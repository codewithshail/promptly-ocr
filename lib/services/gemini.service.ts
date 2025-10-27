import { GoogleGenAI } from "@google/genai";
import {
  EVALUATION_PROMPTS,
  formatPrompt,
  EvaluationResult,
  WEB_SEARCH_CONFIG,
} from "@/lib/config/evaluation-prompts";

/**
 * Configuration for Gemini API calls
 */
export interface GeminiServiceConfig {
  apiKey?: string;
  model?: string;
  enableWebSearch?: boolean;
  enableThinking?: boolean;
}

/**
 * Response from chat with thinking mode
 */
export interface ChatWithThinkingResponse {
  response: string;
  thinkingProcess?: string;
}

/**
 * Image input for multimodal chat
 */
export interface ImageInput {
  url?: string;
  base64?: string;
  mimeType: string;
}

/**
 * Tips response structure
 */
export interface TipsResponse {
  subject: string;
  tips: Tip[];
  sources: string[];
  cachedAt: Date;
}

export interface Tip {
  title: string;
  description: string;
  category: "preparation" | "exam-strategy" | "resources" | "time-management";
  priority: "high" | "medium" | "low";
}

/**
 * GeminiService - Centralized service for all Gemini API interactions
 */
export class GeminiService {
  private genAI: GoogleGenAI;
  private defaultModel: string;

  constructor(config?: GeminiServiceConfig) {
    const apiKey = config?.apiKey || process.env.GEMINI_API_KEY || "";
    this.genAI = new GoogleGenAI({ apiKey });
    this.defaultModel = config?.model || "gemini-2.0-flash-exp";
  }

  /**
   * Chat method with web search support
   * @param message - User message
   * @param config - Optional configuration
   * @param systemInstruction - Optional system instruction to guide the model
   * @returns AI response as string
   */
  async chat(
    message: string,
    config?: GeminiServiceConfig,
    systemInstruction?: string
  ): Promise<string> {
    try {
      const model = config?.model || this.defaultModel;
      const enableWebSearch = config?.enableWebSearch ?? false;

      const tools = enableWebSearch ? [{ googleSearch: {} }] : undefined;

      const result = await this.genAI.models.generateContentStream({
        model,
        contents: message,
        config: {
          tools,
          systemInstruction,
        },
      });

      let responseText = "";
      for await (const chunk of result) {
        if (chunk.text) {
          responseText += chunk.text;
        }
      }

      return responseText.trim();
    } catch (error) {
      console.error("Gemini chat failed:", error);
      throw new Error("Failed to generate chat response");
    }
  }

  /**
   * Chat with thinking mode enabled
   * @param message - User message
   * @param config - Optional configuration
   * @param systemInstruction - Optional system instruction to guide the model
   * @returns Response with thinking process
   */
  async chatWithThinking(
    message: string,
    config?: GeminiServiceConfig,
    systemInstruction?: string
  ): Promise<ChatWithThinkingResponse> {
    try {
      const enableWebSearch = config?.enableWebSearch ?? false;
      const tools = enableWebSearch ? [{ googleSearch: {} }] : undefined;

      const result = await this.genAI.models.generateContentStream({
        model: "gemini-2.0-flash-thinking-exp",
        contents: message,
        config: {
          thinkingConfig: {
            thinkingBudget: -1,
          },
          tools,
          systemInstruction,
        },
      });

      let responseText = "";
      let thinkingProcess = "";

      for await (const chunk of result) {
        // Extract thinking process if available
        const chunkData = chunk as any;
        if (chunkData.thoughts) {
          thinkingProcess += chunkData.thoughts;
        }
        if (chunk.text) {
          responseText += chunk.text;
        }
      }

      return {
        response: responseText.trim(),
        thinkingProcess: thinkingProcess.trim() || undefined,
      };
    } catch (error) {
      console.error("Gemini chat with thinking failed:", error);
      throw new Error("Failed to generate chat response with thinking");
    }
  }

  /**
   * Chat with image support (multimodal)
   * @param message - User message
   * @param image - Image as URL or base64 with mimeType
   * @param config - Optional configuration
   * @param systemInstruction - Optional system instruction to guide the model
   * @returns AI response as string
   */
  async chatWithImage(
    message: string,
    image: ImageInput,
    config?: GeminiServiceConfig,
    systemInstruction?: string
  ): Promise<string> {
    try {
      const model = config?.model || this.defaultModel;
      const enableWebSearch = config?.enableWebSearch ?? false;

      // Validate image input
      if (!image.mimeType) {
        throw new Error("Image mimeType is required");
      }

      if (!image.url && !image.base64) {
        throw new Error("Either image URL or base64 data is required");
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
        throw new Error(
          `Unsupported image format: ${image.mimeType}. Supported formats: JPG, PNG, WEBP, GIF`
        );
      }

      const tools = enableWebSearch ? [{ googleSearch: {} }] : undefined;

      // Prepare image part for Gemini API
      const imagePart = await this.prepareImagePart(image);

      // Create multimodal content with text and image
      const contents = [
        {
          role: "user",
          parts: [{ text: message }, imagePart],
        },
      ];

      const result = await this.genAI.models.generateContentStream({
        model,
        contents,
        config: {
          tools,
          systemInstruction,
        },
      });

      let responseText = "";
      for await (const chunk of result) {
        if (chunk.text) {
          responseText += chunk.text;
        }
      }

      return responseText.trim();
    } catch (error) {
      console.error("Gemini chat with image failed:", error);

      // Handle specific error types
      if (error instanceof Error) {
        if (
          error.message.includes("image format") ||
          error.message.includes("mimeType")
        ) {
          throw error; // Re-throw validation errors as-is
        }
        if (
          error.message.includes("size") ||
          error.message.includes("too large")
        ) {
          throw new Error(
            "Image size exceeds API limits. Please use a smaller image (max 4MB)"
          );
        }
      }

      throw new Error("Failed to generate chat response with image");
    }
  }

  /**
   * Chat with image and thinking mode enabled
   * @param message - User message
   * @param image - Image as URL or base64 with mimeType
   * @param config - Optional configuration
   * @param systemInstruction - Optional system instruction to guide the model
   * @returns Response with thinking process
   */
  async chatWithImageAndThinking(
    message: string,
    image: ImageInput,
    config?: GeminiServiceConfig,
    systemInstruction?: string
  ): Promise<ChatWithThinkingResponse> {
    try {
      const enableWebSearch = config?.enableWebSearch ?? false;

      // Validate image input
      if (!image.mimeType) {
        throw new Error("Image mimeType is required");
      }

      if (!image.url && !image.base64) {
        throw new Error("Either image URL or base64 data is required");
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
        throw new Error(
          `Unsupported image format: ${image.mimeType}. Supported formats: JPG, PNG, WEBP, GIF`
        );
      }

      const tools = enableWebSearch ? [{ googleSearch: {} }] : undefined;

      // Prepare image part for Gemini API
      const imagePart = await this.prepareImagePart(image);

      // Create multimodal content with text and image
      const contents = [
        {
          role: "user",
          parts: [{ text: message }, imagePart],
        },
      ];

      const result = await this.genAI.models.generateContentStream({
        model: "gemini-2.0-flash-thinking-exp",
        contents,
        config: {
          thinkingConfig: {
            thinkingBudget: -1,
          },
          tools,
          systemInstruction,
        },
      });

      let responseText = "";
      let thinkingProcess = "";

      for await (const chunk of result) {
        // Extract thinking process if available
        const chunkData = chunk as any;
        if (chunkData.thoughts) {
          thinkingProcess += chunkData.thoughts;
        }
        if (chunk.text) {
          responseText += chunk.text;
        }
      }

      return {
        response: responseText.trim(),
        thinkingProcess: thinkingProcess.trim() || undefined,
      };
    } catch (error) {
      console.error("Gemini chat with image and thinking failed:", error);

      // Handle specific error types
      if (error instanceof Error) {
        if (
          error.message.includes("image format") ||
          error.message.includes("mimeType")
        ) {
          throw error; // Re-throw validation errors as-is
        }
        if (
          error.message.includes("size") ||
          error.message.includes("too large")
        ) {
          throw new Error(
            "Image size exceeds API limits. Please use a smaller image (max 4MB)"
          );
        }
      }

      throw new Error(
        "Failed to generate chat response with image and thinking"
      );
    }
  }

  /**
   * Helper method to prepare image part for Gemini API
   * @param image - Image input
   * @returns Image part for API request
   */
  private async prepareImagePart(image: ImageInput): Promise<any> {
    if (image.base64) {
      return {
        inlineData: {
          mimeType: image.mimeType,
          data: image.base64,
        },
      };
    } else if (image.url) {
      // For URL-based images, we need to fetch and convert to base64
      const response = await fetch(image.url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch image from URL: ${response.statusText}`
        );
      }
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      return {
        inlineData: {
          mimeType: image.mimeType,
          data: base64,
        },
      };
    }
    throw new Error("Either image URL or base64 data is required");
  }

  /**
   * Evaluate copy (GS or Essay) using configurable prompts
   * @param extractedText - Text extracted from uploaded copy
   * @param copyType - Type of copy ('gs' or 'essay')
   * @returns Evaluation result
   */
  async evaluateCopy(
    extractedText: string,
    copyType: "gs" | "essay"
  ): Promise<EvaluationResult> {
    try {
      const promptTemplate =
        copyType === "gs" ? EVALUATION_PROMPTS.GS : EVALUATION_PROMPTS.ESSAY;
      const prompt = formatPrompt(promptTemplate, { extractedText });

      const result = await this.genAI.models.generateContentStream({
        model: "gemini-2.0-flash-thinking-exp",
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingBudget: -1,
          },
          tools: [{ googleSearch: {} }],
        },
      });

      let responseText = "";
      for await (const chunk of result) {
        if (chunk.text) {
          responseText += chunk.text;
        }
      }

      // Extract JSON from response
      let jsonText = responseText.trim();
      jsonText = jsonText.replace(/```json\s*/g, "").replace(/```\s*/g, "");

      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to extract JSON from evaluation response");
      }

      const evaluation: EvaluationResult = JSON.parse(jsonMatch[0]);
      return evaluation;
    } catch (error) {
      console.error("Copy evaluation failed:", error);
      throw new Error("Failed to evaluate copy");
    }
  }

  /**
   * Generate custom tip for a specific subject and question
   * @param subject - UPSC subject
   * @param question - User's custom question
   * @returns Custom tip response
   */
  async generateCustomTip(subject: string, question: string): Promise<string> {
    try {
      const prompt = `You are an expert UPSC preparation advisor specializing in ${subject}.

A UPSC aspirant has asked the following question about ${subject}:
"${question}"

Provide a comprehensive, actionable tip or advice that directly addresses their question. Your response should:
1. Be specific to ${subject} and the UPSC exam context
2. Include practical, actionable advice
3. Reference relevant study materials, strategies, or resources if applicable
4. Be concise but thorough (aim for 200-400 words)
5. Use a supportive, encouraging tone

Focus on providing value that helps the aspirant improve their preparation for ${subject} in the UPSC exam.`;

      const result = await this.genAI.models.generateContentStream({
        model: this.defaultModel,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      let responseText = "";
      for await (const chunk of result) {
        if (chunk.text) {
          responseText += chunk.text;
        }
      }

      return responseText.trim();
    } catch (error) {
      console.error("Custom tip generation failed:", error);
      throw new Error("Failed to generate custom tip");
    }
  }

  /**
   * Generate a concise summary of conversation messages
   * @param messages - Array of messages to summarize
   * @returns Summary text (max 500 words)
   */
  async generateMessageSummary(
    messages: Array<{ role: string; content: string }>
  ): Promise<string> {
    try {
      if (!messages || messages.length === 0) {
        return "";
      }

      // Format messages for the prompt
      const conversationText = messages
        .map(
          (msg) =>
            `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
        )
        .join("\n\n");

      const prompt = `You are tasked with creating a concise summary of a conversation between a UPSC aspirant and an AI assistant.

Here is the conversation:

${conversationText}

Create a summary that:
1. Captures the key topics discussed
2. Highlights important questions asked by the user
3. Notes significant advice or information provided by the assistant
4. Maintains context for future reference
5. Is concise and focused (maximum 500 words)
6. Uses clear, structured language

The summary will be used to provide context for future messages in this conversation, so focus on information that would be relevant for continuing the discussion.

Provide ONLY the summary text, without any preamble or meta-commentary.`;

      const result = await this.genAI.models.generateContentStream({
        model: this.defaultModel,
        contents: prompt,
      });

      let responseText = "";
      for await (const chunk of result) {
        if (chunk.text) {
          responseText += chunk.text;
        }
      }

      const summary = responseText.trim();

      // Ensure summary doesn't exceed reasonable length (roughly 500 words = ~3000 chars)
      if (summary.length > 3500) {
        return summary.substring(0, 3500) + "...";
      }

      return summary;
    } catch (error) {
      console.error("Message summary generation failed:", error);
      throw new Error("Failed to generate message summary");
    }
  }

  /**
   * Generate tips for a subject with web search
   * @param subject - UPSC subject
   * @param topic - Optional specific topic
   * @returns Tips response with sources
   */
  async generateTips(subject: string, topic?: string): Promise<TipsResponse> {
    try {
      const searchQuery = WEB_SEARCH_CONFIG.TIPS_SEARCH_QUERY(subject, topic);

      const prompt = `You are an expert UPSC preparation advisor. Generate comprehensive tips and strategies for ${subject}${
        topic ? ` focusing on ${topic}` : ""
      }.

Use web search to find the most current and accurate preparation strategies, study materials, and best practices.

Provide tips in the following categories:
1. Preparation strategies
2. Exam strategies and techniques
3. Recommended resources and materials
4. Time management and study planning

For each tip, provide:
- A clear, actionable title
- Detailed description with specific advice
- Category classification
- Priority level (high/medium/low)

Also include sources/references for the information provided.

Return the response in the following JSON format:
{
  "tips": [
    {
      "title": "Tip title",
      "description": "Detailed description with actionable advice",
      "category": "preparation" | "exam-strategy" | "resources" | "time-management",
      "priority": "high" | "medium" | "low"
    }
  ],
  "sources": ["source1", "source2", "source3"]
}

Search query to use: ${searchQuery}

Return ONLY valid JSON, no markdown code blocks.`;

      const result = await this.genAI.models.generateContentStream({
        model: this.defaultModel,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      let responseText = "";
      for await (const chunk of result) {
        if (chunk.text) {
          responseText += chunk.text;
        }
      }

      // Extract JSON from response
      let jsonText = responseText.trim();
      jsonText = jsonText.replace(/```json\s*/g, "").replace(/```\s*/g, "");

      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to extract JSON from tips response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        subject,
        tips: parsed.tips || [],
        sources: parsed.sources || [],
        cachedAt: new Date(),
      };
    } catch (error) {
      console.error("Tips generation failed:", error);
      throw new Error("Failed to generate tips");
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
