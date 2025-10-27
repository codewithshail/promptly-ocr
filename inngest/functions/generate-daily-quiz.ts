import { inngest } from "@/lib/inngest/client";
import { db } from "@/db";
import { dailyQuizzes, newsArticles } from "@/db/schema";
import { gte } from "drizzle-orm";
import { geminiService } from "@/lib/services/gemini.service";

/**
 * Inngest function to generate daily quiz from recent news
 * Runs daily at 6 AM
 */
export const generateDailyQuiz = inngest.createFunction(
  {
    id: "generate-daily-quiz",
    name: "Generate Daily Current Affairs Quiz",
  },
  { cron: "0 6 * * *" }, // Every day at 6 AM
  async ({ step }) => {
    // Step 1: Fetch recent news articles (last 24 hours)
    const recentNews = await step.run("fetch-recent-news", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const articles = await db
        .select()
        .from(newsArticles)
        .where(gte(newsArticles.publishedAt, yesterday))
        .limit(20);

      console.log(`Found ${articles.length} recent news articles`);
      return articles;
    });

    // If no recent news, skip quiz generation
    if (recentNews.length === 0) {
      console.log("No recent news articles found, skipping quiz generation");
      return { success: false, reason: "No recent news articles" };
    }

    // Step 2: Generate quiz questions using Gemini
    const quizQuestions = await step.run("generate-quiz-questions", async () => {
      // Prepare news summaries for the prompt
      const newsSummaries = recentNews
        .map((article, index) => {
          return `Article ${index + 1}:
Title: ${article.title}
Summary: ${article.summary || article.content?.substring(0, 300)}
Category: ${article.category}
Source: ${article.source}
`;
        })
        .join("\n\n");

      const prompt = `You are an expert UPSC exam question creator. Generate 10 multiple-choice questions based on the following recent news articles from the last 24 hours.

Recent News Articles:
${newsSummaries}

Requirements for each question:
1. Focus on UPSC-relevant aspects: facts, policies, international relations, economy, etc.
2. Create 4 options (A, B, C, D) with only ONE correct answer
3. Ensure questions test understanding, not just recall
4. Include a detailed explanation for the correct answer
5. Mix difficulty levels (easy, medium, hard)
6. Cover different categories when possible

Return the response in the following JSON format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation of why this is correct and why others are wrong"
    }
  ]
}

Generate exactly 10 questions. Return ONLY valid JSON, no markdown code blocks.`;

      try {
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

        if (!parsed.questions || !Array.isArray(parsed.questions)) {
          throw new Error("Invalid quiz format: missing questions array");
        }

        // Validate we have 10 questions
        if (parsed.questions.length !== 10) {
          console.warn(`Expected 10 questions, got ${parsed.questions.length}`);
        }

        // Validate each question has required fields
        parsed.questions.forEach((q: any, index: number) => {
          if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length !== 4) {
            throw new Error(`Invalid question format at index ${index}`);
          }
          if (typeof q.correctAnswer !== "number" || q.correctAnswer < 0 || q.correctAnswer > 3) {
            throw new Error(`Invalid correctAnswer at index ${index}`);
          }
          if (!q.explanation) {
            throw new Error(`Missing explanation at index ${index}`);
          }
        });

        console.log(`Generated ${parsed.questions.length} quiz questions`);
        return parsed.questions;
      } catch (error) {
        console.error("Error generating quiz questions:", error);
        throw error;
      }
    });

    // Step 3: Save quiz to database
    const savedQuiz = await step.run("save-quiz", async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day

      try {
        const [quiz] = await db
          .insert(dailyQuizzes)
          .values({
            date: today,
            questions: JSON.stringify(quizQuestions),
          })
          .returning();

        console.log(`Saved daily quiz with ID: ${quiz.id}`);
        return quiz;
      } catch (error) {
        console.error("Error saving quiz:", error);
        throw error;
      }
    });

    // Step 4: Send notifications to users (optional - can be done via separate job)
    await step.run("send-quiz-notifications", async () => {
      try {
        const { notificationService } = await import("@/lib/services/notification.service");
        const { users } = await import("@/db/schema");
        
        // Get all active users (you might want to add filters for users who want notifications)
        const allUsers = await db.select({ id: users.id }).from(users).limit(1000);
        
        console.log(`Sending quiz notifications to ${allUsers.length} users`);
        
        // Send notifications in batches to avoid overwhelming the system
        const batchSize = 100;
        for (let i = 0; i < allUsers.length; i += batchSize) {
          const batch = allUsers.slice(i, i + batchSize);
          await Promise.all(
            batch.map((user) =>
              notificationService.createQuizReadyNotification(user.id, new Date(savedQuiz.date))
            )
          );
        }

        console.log(`Sent ${allUsers.length} quiz ready notifications`);
        return { notificationsSent: allUsers.length };
      } catch (error) {
        console.error("Failed to send quiz notifications:", error);
        // Don't fail the entire job if notifications fail
        return { notificationsSent: 0, error: error instanceof Error ? error.message : "Unknown error" };
      }
    });

    return {
      success: true,
      quizId: savedQuiz.id,
      questionsCount: quizQuestions.length,
      date: savedQuiz.date,
    };
  }
);
