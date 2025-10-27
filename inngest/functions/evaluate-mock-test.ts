import { inngest } from "@/lib/inngest/client";
import { mockTestService } from "@/lib/services/mock-test.service";
import { db } from "@/db";
import { notifications } from "@/db/schema";

/**
 * Inngest function to evaluate mock test attempts
 * Triggered when a test is submitted
 */
export const evaluateMockTest = inngest.createFunction(
  {
    id: "evaluate-mock-test",
    name: "Evaluate Mock Test",
    retries: 2,
  },
  { event: "mock-test/evaluate" },
  async ({ event, step }) => {
    const { attemptId, userId } = event.data;

    // Step 1: Evaluate the test
    const evaluationResult = await step.run("evaluate-test", async () => {
      try {
        return await mockTestService.evaluateTest(attemptId);
      } catch (error) {
        console.error("Failed to evaluate test:", error);
        throw error;
      }
    });

    // Step 2: Create notification for user
    await step.run("create-notification", async () => {
      try {
        await db.insert(notifications).values({
          userId,
          type: "test_completed",
          title: "Mock Test Evaluated",
          message: `Your test has been evaluated. You scored ${evaluationResult.totalScore}/${evaluationResult.maxScore} (${evaluationResult.percentage.toFixed(1)}%)`,
          relatedId: attemptId,
        });
      } catch (error) {
        console.error("Failed to create notification:", error);
        // Don't throw - notification failure shouldn't fail the whole job
      }
    });

    // Step 3: Track activity
    await step.run("track-activity", async () => {
      try {
        // Track test completion activity for streak
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/activities/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            activityType: "test_completed",
            activityData: JSON.stringify({
              attemptId,
              score: evaluationResult.totalScore,
              percentage: evaluationResult.percentage,
            }),
          }),
        });
      } catch (error) {
        console.error("Failed to track activity:", error);
        // Don't throw - activity tracking failure shouldn't fail the whole job
      }
    });

    return {
      success: true,
      attemptId,
      score: evaluationResult.totalScore,
      percentage: evaluationResult.percentage,
    };
  }
);
