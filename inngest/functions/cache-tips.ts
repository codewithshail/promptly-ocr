import { inngest } from "@/lib/inngest/client";
import { db } from "@/db";
import { tipsCache } from "@/db/schema";
import { geminiService } from "@/lib/services/gemini.service";
import { eq, and } from "drizzle-orm";

/**
 * Inngest function to cache tips on demand
 * This job generates tips and caches them for 7 days
 */
export const cacheTips = inngest.createFunction(
  {
    id: "cache-tips",
    retries: 2,
  },
  { event: "tips/request" },
  async ({ event, step }) => {
    const { subject, topic, userId } = event.data;

    console.log(
      `[cache-tips] Processing tips request for subject: ${subject}, topic: ${
        topic || "general"
      }`
    );

    // Step 1: Check if tips already exist in cache
    const existingCache = await step.run("check-cache", async () => {
      const now = new Date();
      const cached = await db
        .select()
        .from(tipsCache)
        .where(
          and(eq(tipsCache.subject, subject), eq(tipsCache.topic, topic || ""))
        )
        .limit(1);

      if (cached.length > 0) {
        const cache = cached[0];
        // Check if cache is still valid (not expired)
        if (cache.expiresAt > now) {
          console.log(`[cache-tips] Valid cache found, skipping generation`);
          return { cached: true, cacheId: cache.id };
        } else {
          console.log(`[cache-tips] Cache expired, will regenerate`);
          return { cached: false, cacheId: cache.id };
        }
      }

      return { cached: false, cacheId: null };
    });

    // If valid cache exists, no need to regenerate
    if (existingCache.cached) {
      return {
        success: true,
        message: "Tips already cached",
        subject,
        topic,
      };
    }

    // Step 2: Generate tips using Gemini service with web search
    const tipsResponse = await step.run("generate-tips", async () => {
      console.log(`[cache-tips] Generating tips with web search enabled`);
      return await geminiService.generateTips(subject, topic);
    });

    // Step 3: Cache the tips for 7 days
    await step.run("save-to-cache", async () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Cache for 7 days

      if (existingCache.cacheId) {
        // Update existing cache entry
        console.log(`[cache-tips] Updating existing cache entry`);
        await db
          .update(tipsCache)
          .set({
            content: JSON.stringify(tipsResponse.tips),
            sources: JSON.stringify(tipsResponse.sources),
            cachedAt: new Date(),
            expiresAt,
          })
          .where(eq(tipsCache.id, existingCache.cacheId));
      } else {
        // Insert new cache entry
        console.log(`[cache-tips] Creating new cache entry`);
        await db.insert(tipsCache).values({
          subject,
          topic: topic || "",
          content: JSON.stringify(tipsResponse.tips),
          sources: JSON.stringify(tipsResponse.sources),
          cachedAt: new Date(),
          expiresAt,
        });
      }

      return { success: true };
    });

    console.log(`[cache-tips] Tips cached successfully for ${subject}`);

    return {
      success: true,
      subject,
      topic,
      tipsCount: tipsResponse.tips.length,
      sourcesCount: tipsResponse.sources.length,
      expiresIn: "7 days",
    };
  }
);
