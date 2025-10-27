import { inngest } from "@/lib/inngest/client";
import { analyticsService } from "@/lib/services/analytics.service";

/**
 * Inngest function to update leaderboard cache daily
 * Runs at midnight every day
 */
export const updateLeaderboard = inngest.createFunction(
  {
    id: "update-leaderboard",
    name: "Update Leaderboard Cache",
  },
  { cron: "0 0 * * *" }, // Run at midnight every day
  async ({ step }) => {
    // Step 1: Generate fresh leaderboard
    const leaderboard = await step.run("generate-leaderboard", async () => {
      console.log("Generating fresh leaderboard data...");
      return await analyticsService.generateLeaderboard(100);
    });

    // Step 2: Log results
    await step.run("log-results", async () => {
      console.log(`Leaderboard updated with ${leaderboard.length} entries`);
      
      // Log top 3 for monitoring
      if (leaderboard.length > 0) {
        console.log("Top 3 users:");
        leaderboard.slice(0, 3).forEach((entry, index) => {
          console.log(
            `${index + 1}. ${entry.anonymousId} - ${entry.totalPoints} points`
          );
        });
      }

      return {
        success: true,
        entriesCount: leaderboard.length,
        timestamp: new Date().toISOString(),
      };
    });

    return {
      success: true,
      leaderboardSize: leaderboard.length,
      updatedAt: new Date().toISOString(),
    };
  }
);
