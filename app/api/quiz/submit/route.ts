import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { dailyQuizzes, quizAttempts, userActivities } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { AnalyticsService } from "@/lib/services/analytics.service";

/**
 * POST /api/quiz/submit
 * Submit quiz answers and calculate score
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { answers, score } = body;

    if (!Array.isArray(answers) || typeof score !== "number") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch today's quiz
    const [todayQuiz] = await db
      .select()
      .from(dailyQuizzes)
      .where(eq(dailyQuizzes.date, today))
      .limit(1);

    if (!todayQuiz) {
      return NextResponse.json(
        { error: "Today's quiz not found" },
        { status: 404 }
      );
    }

    // Check if user has already attempted this quiz
    const [existingAttempt] = await db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, userId),
          eq(quizAttempts.quizId, todayQuiz.id)
        )
      )
      .limit(1);

    if (existingAttempt) {
      return NextResponse.json(
        { error: "You have already completed today's quiz" },
        { status: 400 }
      );
    }

    // Verify score by checking answers against correct answers
    const questions = JSON.parse(todayQuiz.questions);
    let calculatedScore = 0;
    
    answers.forEach((answer: number, index: number) => {
      if (questions[index] && answer === questions[index].correctAnswer) {
        calculatedScore++;
      }
    });

    // Use the calculated score (don't trust client-side score)
    const finalScore = calculatedScore;

    // Save quiz attempt
    const [attempt] = await db
      .insert(quizAttempts)
      .values({
        userId,
        quizId: todayQuiz.id,
        answers: JSON.stringify(answers),
        score: finalScore,
      })
      .returning();

    // Track activity for streak
    await db.insert(userActivities).values({
      userId,
      activityType: "quiz_taken",
      activityData: JSON.stringify({
        quizId: todayQuiz.id,
        score: finalScore,
        totalQuestions: questions.length,
      }),
    });

    // Update user streak
    const analyticsService = new AnalyticsService();
    await analyticsService.updateStreak(userId);

    // Generate detailed feedback
    const feedback = generateFeedback(finalScore, questions.length);

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      score: finalScore,
      totalQuestions: questions.length,
      percentage: (finalScore / questions.length) * 100,
      feedback,
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}

/**
 * Generate feedback based on quiz score
 */
function generateFeedback(score: number, total: number): string {
  const percentage = (score / total) * 100;

  if (percentage >= 90) {
    return "Outstanding! You have excellent knowledge of current affairs. Keep up the great work!";
  } else if (percentage >= 80) {
    return "Excellent work! You're well-informed on current affairs. A few more articles and you'll be perfect!";
  } else if (percentage >= 70) {
    return "Good job! You have a solid understanding of current affairs. Keep reading to improve further.";
  } else if (percentage >= 60) {
    return "Not bad! You're on the right track. Spend more time reading news articles to strengthen your knowledge.";
  } else if (percentage >= 50) {
    return "You're making progress! Focus on reading more current affairs articles daily to improve your score.";
  } else {
    return "Keep practicing! Make it a habit to read news articles daily. Consistency is key to improvement.";
  }
}
