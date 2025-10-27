import { db } from "@/db";
import {
  newsArticles,
  userPreferences,
  dailyQuizzes,
  flashcards,
} from "@/db/schema";
import { eq, desc, inArray, and, gte } from "drizzle-orm";
import { geminiService } from "./gemini.service";

/**
 * News category types for UPSC preparation
 */
export type NewsCategory =
  | "national"
  | "international"
  | "economy"
  | "science-tech"
  | "environment"
  | "polity"
  | "defense"
  | "culture";

/**
 * News article structure from NewsData.io API
 */
export interface NewsDataArticle {
  article_id: string;
  title: string;
  description: string;
  content: string;
  link: string;
  image_url?: string;
  pubDate: string;
  source_id: string;
  category: string[];
}

/**
 * NewsData.io API response structure
 */
interface NewsDataResponse {
  status: string;
  totalResults: number;
  results: NewsDataArticle[];
}

/**
 * Quiz question structure
 */
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  sourceArticleId: string;
}

/**
 * Daily quiz structure
 */
export interface DailyQuizData {
  date: Date;
  questions: QuizQuestion[];
}

/**
 * Flashcard structure
 */
export interface FlashcardData {
  question: string;
  answer: string;
  sourceType: "news";
  sourceId: string;
}

/**
 * NewsService - Service for fetching and managing current affairs news
 * Uses NewsData.io API for Indian news sources
 */
export class NewsService {
  private apiKey: string;
  private baseUrl = "https://newsdata.io/api/1/news";

  constructor() {
    this.apiKey = process.env.NEWSDATA_API_KEY || "";
  }

  /**
   * Fetch latest news from NewsData.io API with retry logic
   * @param categories - Optional categories to filter
   * @param retryCount - Current retry attempt (internal use)
   * @returns Array of news articles
   */
  async fetchLatestNews(
    categories?: NewsCategory[],
    retryCount: number = 0
  ): Promise<NewsDataArticle[]> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    try {
      if (!this.apiKey) {
        console.error("NewsData.io API key not configured");
        throw new Error("NewsData.io API key not configured");
      }

      // Map our categories to NewsData.io categories
      const categoryMap: Record<NewsCategory, string> = {
        national: "politics",
        international: "world",
        economy: "business",
        "science-tech": "technology",
        environment: "environment",
        polity: "politics",
        defense: "politics",
        culture: "entertainment",
      };

      const apiCategories = categories
        ? categories.map((cat) => categoryMap[cat]).join(",")
        : "politics,business,technology,environment,world";

      // Build API URL with parameters
      const params = new URLSearchParams({
        apikey: this.apiKey,
        country: "in", // India
        language: "en",
        category: apiCategories,
        prioritydomain: "thehindu.com,indianexpress.com,pib.gov.in",
      });

      const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
        headers: {
          "Accept": "application/json",
        },
      });

      // Handle rate limiting (429)
      if (response.status === 429) {
        console.warn("NewsData.io API rate limit reached");
        
        if (retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
          console.log(`Retrying after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.fetchLatestNews(categories, retryCount + 1);
        }
        
        throw new Error("NewsData.io API rate limit exceeded");
      }

      if (!response.ok) {
        throw new Error(`NewsData.io API error: ${response.status} ${response.statusText}`);
      }

      const data: NewsDataResponse = await response.json();

      if (data.status !== "success") {
        throw new Error("Failed to fetch news from NewsData.io");
      }

      console.log(`Successfully fetched ${data.results?.length || 0} news articles`);
      return data.results || [];
    } catch (error) {
      console.error("Failed to fetch latest news:", error);
      
      // Retry with exponential backoff for network errors
      if (retryCount < maxRetries && error instanceof Error && 
          (error.message.includes("fetch") || error.message.includes("network"))) {
        const delay = baseDelay * Math.pow(2, retryCount);
        console.log(`Network error, retrying after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchLatestNews(categories, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Update news database with latest articles
   * Includes deduplication logic and fallback to cached news on API failure
   * @returns Number of new articles added
   */
  async updateNewsDatabase(): Promise<number> {
    try {
      const articles = await this.fetchLatestNews();

      if (articles.length === 0) {
        console.log("No new articles fetched from API");
        return 0;
      }

      // Get existing article titles to check for duplicates
      const existingArticles = await db
        .select({ title: newsArticles.title })
        .from(newsArticles)
        .where(
          gte(
            newsArticles.fetchedAt,
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          )
        ); // Last 7 days

      const existingTitles = new Set(
        existingArticles.map((a) => a.title.toLowerCase())
      );

      // Filter out duplicates
      const newArticles = articles.filter(
        (article) => !existingTitles.has(article.title.toLowerCase())
      );

      if (newArticles.length === 0) {
        console.log("No new unique articles to add");
        return 0;
      }

      // Map categories to our format
      const mapCategory = (categories: string[]): NewsCategory => {
        if (categories.includes("politics")) return "polity";
        if (categories.includes("business")) return "economy";
        if (categories.includes("technology")) return "science-tech";
        if (categories.includes("environment")) return "environment";
        if (categories.includes("world")) return "international";
        return "national";
      };

      // Insert new articles
      const insertData = newArticles.map((article) => ({
        title: article.title,
        summary: article.description || "",
        content: article.content || article.description || "",
        source: article.source_id,
        category: mapCategory(article.category),
        imageUrl: article.image_url,
        publishedAt: new Date(article.pubDate),
        externalUrl: article.link,
      }));

      await db.insert(newsArticles).values(insertData);

      console.log(`Successfully added ${newArticles.length} new articles to database`);
      return newArticles.length;
    } catch (error) {
      console.error("Failed to update news database:", error);
      
      // Log error for monitoring
      this.logError("updateNewsDatabase", error);
      
      // Check if we have cached news to fall back on
      const cachedCount = await this.getCachedNewsCount();
      if (cachedCount > 0) {
        console.log(`Falling back to ${cachedCount} cached news articles`);
        return 0; // Return 0 new articles, but cached articles are still available
      }
      
      throw new Error("Failed to update news database and no cached news available");
    }
  }

  /**
   * Get count of cached news articles (last 7 days)
   * @returns Number of cached articles
   */
  private async getCachedNewsCount(): Promise<number> {
    try {
      const cachedArticles = await db
        .select()
        .from(newsArticles)
        .where(
          gte(
            newsArticles.fetchedAt,
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          )
        );
      
      return cachedArticles.length;
    } catch (error) {
      console.error("Failed to get cached news count:", error);
      return 0;
    }
  }

  /**
   * Log error for monitoring
   * @param operation - Operation that failed
   * @param error - Error object
   */
  private logError(operation: string, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";
    
    console.error(`[NewsService Error] Operation: ${operation}`);
    console.error(`Message: ${errorMessage}`);
    if (errorStack) {
      console.error(`Stack: ${errorStack}`);
    }
    
    // In production, you might want to send this to a monitoring service
    // like Sentry, DataDog, etc.
  }

  /**
   * Get personalized news feed for a user
   * @param userId - User ID
   * @param limit - Number of articles to return
   * @returns Array of news articles with preferred categories first
   */
  async getPersonalizedFeed(userId: string, limit: number = 20) {
    try {
      // Get user preferences
      const prefs = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);

      let preferredCategories: NewsCategory[] = [];
      if (prefs.length > 0 && prefs[0].newsCategories) {
        preferredCategories = JSON.parse(prefs[0].newsCategories);
      }

      // If no preferences, return all articles
      if (preferredCategories.length === 0) {
        return await db
          .select()
          .from(newsArticles)
          .orderBy(desc(newsArticles.publishedAt))
          .limit(limit);
      }

      // Fetch preferred articles (70% of limit)
      const preferredLimit = Math.floor(limit * 0.7);
      const preferredArticles = await db
        .select()
        .from(newsArticles)
        .where(inArray(newsArticles.category, preferredCategories))
        .orderBy(desc(newsArticles.publishedAt))
        .limit(preferredLimit);

      // Get IDs of preferred articles to exclude them from "other" articles
      const preferredIds = preferredArticles.map((a) => a.id);

      // Fetch other articles (remaining 30%)
      const remainingLimit = limit - preferredArticles.length;
      let otherArticles: (typeof newsArticles.$inferSelect)[] = [];

      if (remainingLimit > 0) {
        // Get all articles, then filter out preferred ones in memory
        // This is more reliable than complex SQL queries
        const allOtherArticles = await db
          .select()
          .from(newsArticles)
          .orderBy(desc(newsArticles.publishedAt))
          .limit(limit * 2); // Fetch extra to ensure we have enough after filtering

        otherArticles = allOtherArticles
          .filter((article) => !preferredIds.includes(article.id))
          .slice(0, remainingLimit);
      }

      return [...preferredArticles, ...otherArticles];
    } catch (error) {
      console.error("Failed to get personalized feed:", error);
      this.logError("getPersonalizedFeed", error);
      
      // Fallback: return all recent articles without personalization
      try {
        console.log("Falling back to non-personalized feed");
        return await db
          .select()
          .from(newsArticles)
          .orderBy(desc(newsArticles.publishedAt))
          .limit(limit);
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        this.logError("getPersonalizedFeed-fallback", fallbackError);
        return []; // Return empty array as last resort
      }
    }
  }

  /**
   * Generate daily quiz from recent news articles
   * @param articles - News articles to generate quiz from
   * @returns Daily quiz data
   */
  async generateDailyQuiz(
    articles: (typeof newsArticles.$inferSelect)[]
  ): Promise<DailyQuizData> {
    try {
      if (articles.length === 0) {
        throw new Error("No articles provided for quiz generation");
      }

      // Select top 10 most recent articles
      const selectedArticles = articles.slice(0, 10);

      const prompt = `You are a UPSC current affairs quiz generator. Generate 10 multiple-choice questions from the following news articles.

**Articles**:
${selectedArticles
  .map(
    (article, index) =>
      `${index + 1}. ${article.title}\n${
        article.summary || article.content?.substring(0, 200)
      }`
  )
  .join("\n\n")}

**Instructions**:
1. Generate 10 questions covering different articles
2. Each question should test UPSC-relevant knowledge
3. Provide 4 options for each question
4. Include the correct answer index (0-3)
5. Provide a brief explanation for the correct answer
6. Include the source article ID for reference

Return the response in the following JSON format:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 0,
      "explanation": "Explanation for the correct answer",
      "sourceArticleId": "article_id"
    }
  ]
}

Return ONLY valid JSON, no markdown code blocks.`;

      const response = await geminiService.chat(prompt, {
        enableWebSearch: false,
      });

      // Extract JSON from response
      let jsonText = response.trim();
      jsonText = jsonText.replace(/```json\s*/g, "").replace(/```\s*/g, "");

      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to extract JSON from quiz generation response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Map article IDs
      const questionsWithIds = parsed.questions.map(
        (q: QuizQuestion, index: number) => ({
          ...q,
          sourceArticleId: selectedArticles[index % selectedArticles.length].id,
        })
      );

      return {
        date: new Date(),
        questions: questionsWithIds,
      };
    } catch (error) {
      console.error("Failed to generate daily quiz:", error);
      throw new Error("Failed to generate daily quiz");
    }
  }

  /**
   * Create flashcards from a news article
   * @param articleId - Article ID
   * @returns Array of flashcard data
   */
  async createFlashcardsFromArticle(
    articleId: string
  ): Promise<FlashcardData[]> {
    try {
      // Fetch article
      const article = await db
        .select()
        .from(newsArticles)
        .where(eq(newsArticles.id, articleId))
        .limit(1);

      if (article.length === 0) {
        throw new Error("Article not found");
      }

      const articleData = article[0];

      const prompt = `You are a UPSC flashcard generator. Create 5-7 flashcards from the following news article.

**Article**:
Title: ${articleData.title}
Content: ${articleData.content || articleData.summary}

**Instructions**:
1. Generate 5-7 question-answer pairs
2. Questions should test key facts, concepts, and UPSC-relevant information
3. Answers should be concise but complete
4. Focus on information useful for UPSC preparation

Return the response in the following JSON format:
{
  "flashcards": [
    {
      "question": "Question text",
      "answer": "Answer text"
    }
  ]
}

Return ONLY valid JSON, no markdown code blocks.`;

      const response = await geminiService.chat(prompt, {
        enableWebSearch: false,
      });

      // Extract JSON from response
      let jsonText = response.trim();
      jsonText = jsonText.replace(/```json\s*/g, "").replace(/```\s*/g, "");

      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(
          "Failed to extract JSON from flashcard generation response"
        );
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return parsed.flashcards.map(
        (fc: { question: string; answer: string }) => ({
          question: fc.question,
          answer: fc.answer,
          sourceType: "news" as const,
          sourceId: articleId,
        })
      );
    } catch (error) {
      console.error("Failed to create flashcards:", error);
      throw new Error("Failed to create flashcards from article");
    }
  }

  /**
   * Get cached news articles (fallback when API fails)
   * @param limit - Number of articles to return
   * @returns Array of cached news articles
   */
  async getCachedNews(limit: number = 20) {
    try {
      return await db
        .select()
        .from(newsArticles)
        .orderBy(desc(newsArticles.publishedAt))
        .limit(limit);
    } catch (error) {
      console.error("Failed to get cached news:", error);
      throw new Error("Failed to get cached news");
    }
  }
}

// Export singleton instance
export const newsService = new NewsService();
