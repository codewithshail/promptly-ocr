import { redis } from "@/lib/redis";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinkingProcess?: string;
  timestamp: string;
  image?: {
    url: string;
    mimeType: string;
  };
}

export interface ChatSession {
  sessionId: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  summary?: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionMetadata {
  sessionId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

const REDIS_KEY_PREFIX = "chat";
const SESSION_TTL = 90 * 24 * 60 * 60; // 90 days in seconds

class ChatService {
  /**
   * Generate Redis key for a chat session
   */
  private getSessionKey(userId: string, sessionId: string): string {
    return `${REDIS_KEY_PREFIX}:${userId}:${sessionId}`;
  }

  /**
   * Generate Redis key for user's session list
   */
  private getUserSessionsKey(userId: string): string {
    return `${REDIS_KEY_PREFIX}:${userId}:sessions`;
  }

  /**
   * Create a new chat session
   */
  async createSession(userId: string): Promise<string> {
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();

    const session: ChatSession = {
      sessionId,
      userId,
      title: "New Chat",
      messages: [],
      summary: undefined,
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const sessionKey = this.getSessionKey(userId, sessionId);

    // Store session with TTL
    await redis.setex(sessionKey, SESSION_TTL, JSON.stringify(session));

    // Add to user's session list
    const sessionsKey = this.getUserSessionsKey(userId);
    const metadata: SessionMetadata = {
      sessionId,
      userId,
      title: session.title,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
    };

    await redis.zadd(sessionsKey, {
      score: Date.now(),
      member: JSON.stringify(metadata),
    });

    // Set TTL on sessions list
    await redis.expire(sessionsKey, SESSION_TTL);

    return sessionId;
  }

  /**
   * Generate AI title for chat session based on first exchange
   */
  private async generateChatTitle(
    userMessage: string,
    assistantResponse: string
  ): Promise<string> {
    try {
      // Import geminiService dynamically to avoid circular dependencies
      const { geminiService } = await import("@/lib/services/gemini.service");

      const prompt = `Generate a very short title (2-4 words max) for this chat. Be concise and specific. Return ONLY the title without quotes or punctuation.

User: ${userMessage.slice(0, 150)}
Assistant: ${assistantResponse.slice(0, 150)}

Title:`;

      const title = await geminiService.chat(prompt, {
        enableWebSearch: false,
      });

      // Clean up the title (remove quotes, trim, limit length to 40 chars)
      const cleanTitle = title
        .replace(/['"]/g, "")
        .replace(/^(Title:|Chat:)\s*/i, "")
        .trim()
        .slice(0, 40);

      // If title is still too long or empty, use fallback
      if (!cleanTitle || cleanTitle.length > 40) {
        return (
          userMessage.slice(0, 35) + (userMessage.length > 35 ? "..." : "")
        );
      }

      return cleanTitle;
    } catch (error) {
      console.error("Error generating chat title:", error);
      // Fallback to simple truncation
      return userMessage.slice(0, 35) + (userMessage.length > 35 ? "..." : "");
    }
  }

  /**
   * Save a message to a chat session
   */
  async saveMessage(
    userId: string,
    sessionId: string,
    message: Omit<ChatMessage, "id" | "timestamp">,
    shouldGenerateTitle: boolean = false
  ): Promise<ChatMessage> {
    const sessionKey = this.getSessionKey(userId, sessionId);

    // Get existing session - Upstash Redis automatically deserializes JSON
    const sessionData = await redis.get(sessionKey);

    let session: ChatSession;

    if (!sessionData) {
      // Session doesn't exist, create it
      const now = new Date().toISOString();
      session = {
        sessionId,
        userId,
        title: "New Chat",
        messages: [],
        summary: undefined,
        messageCount: 0,
        createdAt: now,
        updatedAt: now,
      };
    } else {
      // sessionData is already an object, no need to parse
      session = sessionData as ChatSession;
      // Ensure backward compatibility - add new fields if they don't exist
      if (session.messageCount === undefined) {
        session.messageCount = session.messages.length;
      }
    }

    // Create new message
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      ...message,
      timestamp: new Date().toISOString(),
    };

    // Add message to session
    session.messages.push(newMessage);
    session.updatedAt = newMessage.timestamp;
    session.messageCount = session.messages.length;

    // Generate AI title after first exchange (user message + assistant response)
    if (
      shouldGenerateTitle &&
      session.title === "New Chat" &&
      message.role === "assistant" &&
      session.messages.length >= 2
    ) {
      const userMsg = session.messages.find((m) => m.role === "user");
      if (userMsg) {
        session.title = await this.generateChatTitle(
          userMsg.content,
          message.content
        );
      }
    }

    // Save updated session with TTL - store as JSON string
    await redis.setex(sessionKey, SESSION_TTL, JSON.stringify(session));

    // Update session metadata in user's session list
    await this.updateSessionMetadata(
      userId,
      sessionId,
      session.title,
      session.messageCount
    );

    return newMessage;
  }

  /**
   * Load a chat session
   */
  async loadSession(
    userId: string,
    sessionId: string
  ): Promise<ChatSession | null> {
    const sessionKey = this.getSessionKey(userId, sessionId);
    const sessionData = await redis.get(sessionKey);

    if (!sessionData) {
      return null;
    }

    // Upstash Redis automatically deserializes JSON
    return sessionData as ChatSession;
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionMetadata[]> {
    const sessionsKey = this.getUserSessionsKey(userId);

    // Get all sessions sorted by timestamp (newest first)
    const sessions = await redis.zrange(sessionsKey, 0, -1, {
      rev: true,
    });

    if (!sessions || sessions.length === 0) {
      return [];
    }

    // Upstash Redis returns strings for sorted set members
    return sessions.map((s) => (typeof s === "string" ? JSON.parse(s) : s));
  }

  /**
   * Get the most recent session for a user
   */
  async getMostRecentSession(userId: string): Promise<ChatSession | null> {
    const sessions = await this.getUserSessions(userId);

    if (sessions.length === 0) {
      return null;
    }

    const mostRecent = sessions[0];
    return this.loadSession(userId, mostRecent.sessionId);
  }

  /**
   * Update session metadata in user's session list
   */
  async updateSessionMetadata(
    userId: string,
    sessionId: string,
    title: string,
    messageCount: number
  ): Promise<void> {
    const sessionsKey = this.getUserSessionsKey(userId);

    // Get all sessions
    const sessions = await redis.zrange(sessionsKey, 0, -1);

    if (!sessions) {
      return;
    }

    // Find and update the session
    for (const sessionData of sessions) {
      const sessionStr =
        typeof sessionData === "string"
          ? sessionData
          : JSON.stringify(sessionData);
      const session: SessionMetadata =
        typeof sessionData === "string" ? JSON.parse(sessionData) : sessionData;

      if (session.sessionId === sessionId) {
        // Remove old entry
        await redis.zrem(sessionsKey, sessionStr);

        // Add updated entry with new timestamp
        const updatedSession: SessionMetadata = {
          ...session,
          title,
          messageCount,
          updatedAt: new Date().toISOString(),
        };

        await redis.zadd(sessionsKey, {
          score: Date.now(),
          member: JSON.stringify(updatedSession),
        });

        // Set TTL on sessions list
        await redis.expire(sessionsKey, SESSION_TTL);

        break;
      }
    }
  }

  /**
   * Delete a chat session
   */
  async deleteSession(userId: string, sessionId: string): Promise<void> {
    const sessionKey = this.getSessionKey(userId, sessionId);

    // Delete session data
    await redis.del(sessionKey);

    // Remove from user's session list
    const sessionsKey = this.getUserSessionsKey(userId);
    const sessions = await redis.zrange(sessionsKey, 0, -1);

    if (!sessions) {
      return;
    }

    for (const sessionData of sessions) {
      const sessionStr =
        typeof sessionData === "string"
          ? sessionData
          : JSON.stringify(sessionData);
      const session: SessionMetadata =
        typeof sessionData === "string" ? JSON.parse(sessionData) : sessionData;

      if (session.sessionId === sessionId) {
        await redis.zrem(sessionsKey, sessionStr);
        break;
      }
    }
  }

  /**
   * Get conversation context with summary for API calls
   * Returns last 10 messages + summary of older messages if applicable
   */
  async getConversationContext(
    userId: string,
    sessionId: string
  ): Promise<{
    messages: ChatMessage[];
    summary?: string;
    totalMessages: number;
  }> {
    const session = await this.loadSession(userId, sessionId);

    if (!session) {
      return {
        messages: [],
        summary: undefined,
        totalMessages: 0,
      };
    }

    const totalMessages = session.messages.length;
    const last10Messages = session.messages.slice(-10);

    return {
      messages: last10Messages,
      summary: session.summary,
      totalMessages,
    };
  }

  /**
   * Generate summary of older messages (messages beyond the last 10)
   * This is called when conversation exceeds 10 message pairs (20 messages)
   */
  async generateMessageSummary(
    userId: string,
    sessionId: string
  ): Promise<void> {
    try {
      const session = await this.loadSession(userId, sessionId);

      if (!session) {
        console.warn(
          `Cannot generate summary: session ${sessionId} not found`
        );
        return;
      }

      // Only generate summary if we have more than 10 message pairs (20 messages)
      // and don't already have a summary
      if (session.messages.length <= 20) {
        return;
      }

      // Get messages to summarize (all except the last 10)
      const messagesToSummarize = session.messages.slice(0, -10);

      if (messagesToSummarize.length === 0) {
        return;
      }

      // Import geminiService dynamically to avoid circular dependencies
      const { geminiService } = await import("@/lib/services/gemini.service");

      // Format messages for summary generation
      const formattedMessages = messagesToSummarize.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Generate summary
      const summary = await geminiService.generateMessageSummary(
        formattedMessages
      );

      // Update session with summary
      session.summary = summary;
      session.updatedAt = new Date().toISOString();

      // Save updated session
      const sessionKey = this.getSessionKey(userId, sessionId);
      await redis.setex(sessionKey, SESSION_TTL, JSON.stringify(session));

      console.log(
        `Generated summary for session ${sessionId} (${messagesToSummarize.length} messages summarized)`
      );
    } catch (error) {
      // Log error but don't throw - summary generation failure shouldn't block conversation
      console.error(
        `Failed to generate summary for session ${sessionId}:`,
        error
      );
    }
  }

  /**
   * Get sessions older than specified days (for archival)
   */
  async getOldSessions(
    days: number
  ): Promise<{ userId: string; sessionId: string }[]> {
    // This would require scanning all user keys
    // For now, we'll rely on Redis TTL to handle expiration
    // This method can be implemented when we need explicit archival
    throw new Error(
      "Not implemented - Redis TTL handles expiration automatically"
    );
  }
}

export const chatService = new ChatService();
