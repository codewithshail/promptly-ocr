import { inngest } from "@/lib/inngest/client";
import { db } from "@/db";
import { copyEvaluations, revisionSchedule } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fileProcessingService } from "@/lib/services/file-processing.service";
import { evaluationService } from "@/lib/services/evaluation.service";
import { analyticsService } from "@/lib/services/analytics.service";

/**
 * Inngest function to process uploaded copy
 * Steps:
 * 1. Extract text from file (OCR)
 * 2. Evaluate using appropriate algorithm (GS or Essay)
 * 3. Update database with results
 * 4. Add topics to revision schedule
 * 5. Send notification (future implementation)
 */
export const processCopy = inngest.createFunction(
  {
    id: "process-copy",
    name: "Process Copy for Evaluation",
    retries: 3,
  },
  { event: "copy/uploaded" },
  async ({ event, step }) => {
    const { copyId, fileUrl, fileType, copyType, userId } = event.data;

    console.log("Starting copy processing:", {
      copyId,
      copyType,
      fileUrl,
    });

    // Step 1: Update status to 'processing'
    await step.run("update-status-processing", async () => {
      await db
        .update(copyEvaluations)
        .set({
          status: "processing",
          updatedAt: new Date(),
        })
        .where(eq(copyEvaluations.id, copyId));

      return { status: "processing" };
    });

    // Step 2: Extract text from file
    const extractedText = await step.run("extract-text", async () => {
      try {
        console.log("Extracting text from file:", fileUrl);
        const text = await fileProcessingService.extractText(fileUrl, fileType);

        if (!text || text.trim().length === 0) {
          throw new Error("No text could be extracted from the file");
        }

        console.log("Text extracted successfully, length:", text.length);

        // Update database with extracted text
        await db
          .update(copyEvaluations)
          .set({
            extractedText: text,
            updatedAt: new Date(),
          })
          .where(eq(copyEvaluations.id, copyId));

        return text;
      } catch (error) {
        console.error("Text extraction failed:", error);
        
        // Update database with error
        await db
          .update(copyEvaluations)
          .set({
            status: "failed",
            errorMessage: `Text extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            updatedAt: new Date(),
          })
          .where(eq(copyEvaluations.id, copyId));

        throw error;
      }
    });

    // Step 3: Evaluate the copy
    const evaluation = await step.run("evaluate-copy", async () => {
      try {
        console.log("Evaluating copy:", copyType);

        let evaluationResult;
        if (copyType === "gs") {
          evaluationResult = await evaluationService.evaluateGS(extractedText);
        } else if (copyType === "essay") {
          evaluationResult = await evaluationService.evaluateEssay(extractedText);
        } else {
          throw new Error(`Invalid copy type: ${copyType}`);
        }

        console.log("Evaluation completed:", {
          totalScore: evaluationResult.totalScore,
          maxScore: evaluationResult.maxScore,
        });

        // Validate evaluation result
        const validation = evaluationService.validateEvaluationResult(evaluationResult);
        if (!validation.valid) {
          console.warn("Evaluation result validation warnings:", validation.errors);
        }

        return evaluationResult;
      } catch (error) {
        console.error("Evaluation failed:", error);
        
        // Update database with error
        await db
          .update(copyEvaluations)
          .set({
            status: "failed",
            errorMessage: `Evaluation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            updatedAt: new Date(),
          })
          .where(eq(copyEvaluations.id, copyId));

        throw error;
      }
    });

    // Step 4: Update database with evaluation results
    await step.run("update-evaluation-results", async () => {
      try {
        await db
          .update(copyEvaluations)
          .set({
            evaluationResult: JSON.stringify(evaluation),
            status: "completed",
            updatedAt: new Date(),
          })
          .where(eq(copyEvaluations.id, copyId));

        console.log("Database updated with evaluation results");

        // Track copy upload activity (updates streak)
        await analyticsService.trackActivity(userId, "copy_upload", {
          copyId,
          copyType,
          score: evaluation.totalScore,
        });

        return { success: true };
      } catch (error) {
        console.error("Failed to update database:", error);
        throw error;
      }
    });

    // Step 5: Extract and add topics to revision schedule
    await step.run("add-to-revision-schedule", async () => {
      try {
        // Extract weak areas or topics from evaluation feedback
        const weakTopics = extractWeakTopics(evaluation, copyType);

        if (weakTopics.length > 0) {
          console.log("Adding topics to revision schedule:", weakTopics);

          // Calculate initial revision date (1 day from now)
          const nextRevisionDate = new Date();
          nextRevisionDate.setDate(nextRevisionDate.getDate() + 1);

          // Add each topic to revision schedule
          for (const topic of weakTopics) {
            await db.insert(revisionSchedule).values({
              userId,
              topic: topic.name,
              subject: topic.subject,
              lastRevisedAt: new Date(),
              nextRevisionAt: nextRevisionDate,
              revisionCount: 0,
              difficulty: topic.difficulty || "medium",
            });
          }

          console.log(`Added ${weakTopics.length} topics to revision schedule`);
        }

        return { topicsAdded: weakTopics.length };
      } catch (error) {
        // Don't fail the entire job if revision schedule update fails
        console.error("Failed to add topics to revision schedule:", error);
        return { topicsAdded: 0, error: error instanceof Error ? error.message : "Unknown error" };
      }
    });

    // Step 6: Send notification
    await step.run("send-notification", async () => {
      try {
        const { notificationService } = await import("@/lib/services/notification.service");
        
        await notificationService.createEvaluationCompleteNotification(
          userId,
          copyId,
          evaluation.totalScore,
          copyType
        );

        console.log("Evaluation complete notification sent:", {
          userId,
          copyId,
          score: evaluation.totalScore,
        });

        return { notificationSent: true };
      } catch (error) {
        console.error("Failed to send notification:", error);
        return { notificationSent: false, error: error instanceof Error ? error.message : "Unknown error" };
      }
    });

    console.log("Copy processing completed successfully:", copyId);

    return {
      success: true,
      copyId,
      totalScore: evaluation.totalScore,
      maxScore: evaluation.maxScore,
    };
  }
);

/**
 * Extract weak topics from evaluation result
 * @param evaluation - Evaluation result
 * @param copyType - Type of copy (gs or essay)
 * @returns Array of topics to add to revision schedule
 */
function extractWeakTopics(
  evaluation: any,
  copyType: string
): Array<{ name: string; subject: string; difficulty: string }> {
  const topics: Array<{ name: string; subject: string; difficulty: string }> = [];

  try {
    // Extract topics from breakdown items with low scores
    if (evaluation.breakdown && Array.isArray(evaluation.breakdown)) {
      for (const item of evaluation.breakdown) {
        // If score is less than 60% of max score, consider it weak
        const percentage = (item.score / item.maxScore) * 100;
        if (percentage < 60) {
          topics.push({
            name: item.criterion,
            subject: copyType === "gs" ? "General Studies" : "Essay Writing",
            difficulty: percentage < 40 ? "hard" : "medium",
          });
        }
      }
    }

    // Extract topics from recommendations if they mention specific subjects
    if (evaluation.recommendations && Array.isArray(evaluation.recommendations)) {
      const subjectKeywords = [
        "history",
        "geography",
        "polity",
        "economy",
        "science",
        "environment",
        "ethics",
        "current affairs",
        "mathematics",
      ];

      for (const recommendation of evaluation.recommendations) {
        const lowerRec = recommendation.toLowerCase();
        for (const keyword of subjectKeywords) {
          if (lowerRec.includes(keyword)) {
            // Check if we haven't already added this topic
            if (!topics.some((t) => t.name.toLowerCase().includes(keyword))) {
              topics.push({
                name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
                subject: copyType === "gs" ? "General Studies" : "Essay Writing",
                difficulty: "medium",
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error extracting weak topics:", error);
  }

  // Limit to top 5 topics
  return topics.slice(0, 5);
}
