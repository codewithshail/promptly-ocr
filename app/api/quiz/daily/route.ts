import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { dailyQuizzes, quizAttempts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/quiz/daily
 * Get today's daily quiz and check if user has already attempted it
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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
        {
          quiz: null,
          attempted: false,
          message: "Today's quiz is not available yet. Please check back later.",
        },
        { status: 200 }
      );
    }

    // Check if user has already attempted this quiz
    const [attempt] = await db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, userId),
          eq(quizAttempts.quizId, todayQuiz.id)
        )
      )
      .limit(1);

    if (attempt) {
      return NextResponse.json({
        quiz: null,
        attempted: true,
        score: attempt.score,
        completedAt: attempt.completedAt,
      });
    }

    // Parse questions from JSON
    const questions = JSON.parse(todayQuiz.questions);

    return NextResponse.json({
      quiz: {
        id: todayQuiz.id,
        date: todayQuiz.date,
        questions,
      },
      attempted: false,
    });
  } catch (error) {
    console.error("Error fetching daily quiz:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily quiz" },
      { status: 500 }
    );
  }
}
