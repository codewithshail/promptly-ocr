import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { analyticsService } from "@/lib/services/analytics.service";
import { db } from "@/db";
import { userPreferences, copyEvaluations, mockTestAttempts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { EvaluationResult } from "@/lib/config/evaluation-prompts";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's stats
    const userProgress = await analyticsService.getProgressTrends(userId);
    const userAvgScore = userProgress.overallStats.averageScore;
    const userStreak = userProgress.overallStats.currentStreak;
    const userEvaluations = userProgress.overallStats.totalEvaluations;

    // Get user's test attempts
    const userTests = await db
      .select()
      .from(mockTestAttempts)
      .where(
        and(
          eq(mockTestAttempts.userId, userId),
          eq(mockTestAttempts.status, "completed")
        )
      );
    const userTestsCompleted = userTests.length;

    // Get all users' evaluations for platform average
    const allEvaluations = await db
      .select()
      .from(copyEvaluations)
      .where(eq(copyEvaluations.status, "completed"));

    // Calculate platform averages
    const userScores: Map<string, number[]> = new Map();

    for (const evaluation of allEvaluations) {
      if (!evaluation.evaluationResult) continue;

      try {
        const result: EvaluationResult = JSON.parse(evaluation.evaluationResult);
        const evalUserId = evaluation.userId;

        if (!userScores.has(evalUserId)) {
          userScores.set(evalUserId, []);
        }

        userScores.get(evalUserId)!.push(result.totalScore);
      } catch (error) {
        console.error("Failed to parse evaluation result:", error);
      }
    }

    // Calculate average scores for all users
    const allUserAverages = Array.from(userScores.values()).map((scores) =>
      scores.reduce((sum, score) => sum + score, 0) / scores.length
    );

    const platformAvgScore =
      allUserAverages.length > 0
        ? allUserAverages.reduce((sum, avg) => sum + avg, 0) /
          allUserAverages.length
        : 0;

    // Get all streaks
    const allPrefs = await db.select().from(userPreferences);
    const allStreaks = allPrefs.map((p) => p.dailyStreak || 0);
    const platformAvgStreak =
      allStreaks.length > 0
        ? allStreaks.reduce((sum, streak) => sum + streak, 0) / allStreaks.length
        : 0;

    // Calculate tests completed comparison
    const allTestCounts = Array.from(userScores.values()).map(
      (scores) => scores.length
    );
    const platformAvgTests =
      allTestCounts.length > 0
        ? allTestCounts.reduce((sum, count) => sum + count, 0) /
          allTestCounts.length
        : 0;

    // Calculate evaluations average
    const platformAvgEvaluations =
      allTestCounts.length > 0
        ? allTestCounts.reduce((sum, count) => sum + count, 0) /
          allTestCounts.length
        : 0;

    // Calculate percentile
    const betterThanCount = allUserAverages.filter(
      (avg) => userAvgScore > avg
    ).length;
    const percentile =
      allUserAverages.length > 0
        ? (betterThanCount / allUserAverages.length) * 100
        : 50;

    return NextResponse.json({
      userAverageScore: userAvgScore,
      platformAverageScore: Math.round(platformAvgScore * 10) / 10,
      userStreak,
      platformAverageStreak: Math.round(platformAvgStreak * 10) / 10,
      userTestsCompleted,
      platformAverageTests: Math.round(platformAvgTests * 10) / 10,
      userEvaluations,
      platformAverageEvaluations: Math.round(platformAvgEvaluations * 10) / 10,
      percentile: Math.round(percentile),
    });
  } catch (error) {
    console.error("Failed to fetch performance comparison:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance comparison" },
      { status: 500 }
    );
  }
}
