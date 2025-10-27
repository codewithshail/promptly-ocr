import { inngest } from "@/lib/inngest/client";
import { newsService } from "@/lib/services/news.service";

/**
 * Scheduled Inngest function to fetch latest news
 * Runs every 8 hours (3 times daily) to keep news database updated
 * 
 * Schedule: At minute 0 past every 8th hour
 * - 00:00 (midnight)
 * - 08:00 (8 AM)
 * - 16:00 (4 PM)
 */
export const fetchNews = inngest.createFunction(
  {
    id: "fetch-news",
    name: "Fetch Latest News",
    retries: 3,
  },
  { cron: "0 */8 * * *" }, // Every 8 hours
  async ({ step }) => {
    // Step 1: Fetch latest news from NewsData.io API
    const newArticlesCount = await step.run("fetch-and-save-news", async () => {
      try {
        console.log("Starting news fetch job...");
        
        // Update news database with latest articles
        // This method handles fetching from API and deduplication
        const count = await newsService.updateNewsDatabase();
        
        console.log(`Successfully fetched and saved ${count} new articles`);
        return count;
      } catch (error) {
        console.error("Error fetching news:", error);
        throw error;
      }
    });

    // Step 2: Log results
    await step.run("log-results", async () => {
      console.log(`News fetch job completed. Added ${newArticlesCount} new articles.`);
      return {
        success: true,
        articlesAdded: newArticlesCount,
        timestamp: new Date().toISOString(),
      };
    });

    return {
      success: true,
      articlesAdded: newArticlesCount,
      message: `Successfully fetched ${newArticlesCount} new articles`,
    };
  }
);

/**
 * Manual trigger function for fetching news on-demand
 * Can be triggered via event: inngest.send({ name: "news/fetch.manual" })
 */
export const fetchNewsManual = inngest.createFunction(
  {
    id: "fetch-news-manual",
    name: "Fetch News (Manual)",
    retries: 2,
  },
  { event: "news/fetch.manual" },
  async ({ step }) => {
    const newArticlesCount = await step.run("fetch-and-save-news", async () => {
      try {
        console.log("Starting manual news fetch...");
        const count = await newsService.updateNewsDatabase();
        console.log(`Manually fetched and saved ${count} new articles`);
        return count;
      } catch (error) {
        console.error("Error in manual news fetch:", error);
        throw error;
      }
    });

    return {
      success: true,
      articlesAdded: newArticlesCount,
      message: `Manually fetched ${newArticlesCount} new articles`,
    };
  }
);
