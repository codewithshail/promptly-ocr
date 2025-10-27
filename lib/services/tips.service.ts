import { redis } from "@/lib/redis";
import { geminiService } from "@/lib/services/gemini.service";
import crypto from "crypto";

/**
 * Custom tip structure
 */
export interface CustomTip {
  question: string;
  answer: string;
  subject: string;
  timestamp: string;
  cacheId: string;
}

/**
 * Response from generateCustomTip
 */
export interface CustomTipResponse {
  tip: CustomTip;
  cached: boolean;
}

const REDIS_KEY_PREFIX = "custom-tip";
const CUSTOM_TIP_TTL = 24 * 60 * 60; // 24 hours in seconds

/**
 * TipsService - Service for managing custom tip generation and caching
 */
class TipsService {
  /**
   * Generate Redis key for a custom tip
   * Format: custom-tip:{userId}:{subject}:{questionHash}
   */
  private getCacheKey(
    userId: string,
    subject: string,
    questionHash: string
  ): string {
    return `${REDIS_KEY_PREFIX}:${userId}:${subject}:${questionHash}`;
  }

  /**
   * Generate a hash for the question to use as cache key
   */
  private generateQuestionHash(question: string): string {
    return crypto.createHash("sha256").update(question.toLowerCase().trim()).digest("hex");
  }

  /**
   * Get cached custom tip from Redis
   * @param userId - User ID
   * @param subject - UPSC subject
   * @param questionHash - Hash of the question
   * @returns Custom tip if found, null otherwise
   */
  async getCachedCustomTip(
    userId: string,
    subject: string,
    questionHash: string
  ): Promise<CustomTip | null> {
    try {
      const cacheKey = this.getCacheKey(userId, subject, questionHash);
      const cachedData = await redis.get(cacheKey);

      if (!cachedData) {
        return null;
      }

      // Upstash Redis automatically deserializes JSON
      return cachedData as CustomTip;
    } catch (error) {
      console.error("Failed to retrieve cached custom tip:", error);
      return null;
    }
  }

  /**
   * Cache custom tip in Redis with 24-hour TTL
   * @param userId - User ID
   * @param subject - UPSC subject
   * @param tip - Custom tip to cache
   * @returns Cache ID (question hash) for bookmarking
   */
  async cacheCustomTip(
    userId: string,
    subject: string,
    tip: CustomTip
  ): Promise<string> {
    try {
      const questionHash = this.generateQuestionHash(tip.question);
      const cacheKey = this.getCacheKey(userId, subject, questionHash);

      // Store tip in Redis with 24-hour TTL
      await redis.setex(cacheKey, CUSTOM_TIP_TTL, JSON.stringify(tip));

      return questionHash;
    } catch (error) {
      console.error("Failed to cache custom tip:", error);
      throw new Error("Failed to cache custom tip");
    }
  }

  /**
   * Generate custom tip for a subject and question
   * Checks cache first, generates new tip if not cached
   * @param userId - User ID
   * @param subject - UPSC subject
   * @param question - User's custom question
   * @returns Custom tip with cache status
   */
  async generateCustomTip(
    userId: string,
    subject: string,
    question: string
  ): Promise<CustomTipResponse> {
    try {
      // Generate question hash for cache key
      const questionHash = this.generateQuestionHash(question);

      // Check Redis cache for existing tip
      const cachedTip = await this.getCachedCustomTip(userId, subject, questionHash);

      if (cachedTip) {
        return {
          tip: cachedTip,
          cached: true,
        };
      }

      // Not cached, generate new tip using GeminiService
      const answer = await geminiService.generateCustomTip(subject, question);

      // Create custom tip object
      const tip: CustomTip = {
        question,
        answer,
        subject,
        timestamp: new Date().toISOString(),
        cacheId: questionHash,
      };

      // Store in Redis with 24-hour TTL
      await this.cacheCustomTip(userId, subject, tip);

      return {
        tip,
        cached: false,
      };
    } catch (error) {
      console.error("Failed to generate custom tip:", error);
      throw new Error("Failed to generate custom tip");
    }
  }
}

export const tipsService = new TipsService();
