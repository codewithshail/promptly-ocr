import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin";
import { db } from "@/db";
import {
  users,
  copyEvaluations,
  mockTestAttempts,
  answerTemplates,
  newsArticles,
  userActivities,
} from "@/db/schema";
import { eq, gte, sql } from "drizzle-orm";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total users
    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const totalUsers = Number(totalUsersResult[0]?.count || 0);

    // Get active users (users with activity in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeUsersResult = await db
      .select({ userId: userActivities.userId })
      .from(userActivities)
      .where(gte(userActivities.createdAt, sevenDaysAgo))
      .groupBy(userActivities.userId);
    const activeUsers = activeUsersResult.length;

    // Get evaluations today
    const evaluationsTodayResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(copyEvaluations)
      .where(gte(copyEvaluations.createdAt, today));
    const evaluationsToday = Number(evaluationsTodayResult[0]?.count || 0);

    // Get total evaluations
    const totalEvaluationsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(copyEvaluations);
    const totalEvaluations = Number(totalEvaluationsResult[0]?.count || 0);

    // Get tests completed
    const testsCompletedResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(mockTestAttempts)
      .where(eq(mockTestAttempts.status, "completed"));
    const testsCompleted = Number(testsCompletedResult[0]?.count || 0);

    // Get total tests available
    const totalTestsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(mockTestAttempts);
    const totalTests = Number(totalTestsResult[0]?.count || 0);

    // Get total templates
    const totalTemplatesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(answerTemplates);
    const totalTemplates = Number(totalTemplatesResult[0]?.count || 0);

    // Get total news
    const totalNewsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(newsArticles);
    const totalNews = Number(totalNewsResult[0]?.count || 0);

    // Get recent activity
    const recentActivityData = await db
      .select({
        id: userActivities.id,
        type: userActivities.activityType,
        createdAt: userActivities.createdAt,
      })
      .from(userActivities)
      .orderBy(sql`${userActivities.createdAt} DESC`)
      .limit(10);

    const recentActivity = recentActivityData.map((activity) => ({
      id: activity.id,
      type: activity.type as "evaluation" | "test" | "user" | "news",
      description: getActivityDescription(activity.type),
      timestamp: activity.createdAt,
      status: "success" as const,
    }));

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        evaluationsToday,
        testsCompleted,
        totalEvaluations,
        totalTests,
        totalTemplates,
        totalNews,
      },
      recentActivity,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}

function getActivityDescription(activityType: string): string {
  const descriptions: Record<string, string> = {
    chat_message: "User sent a chat message",
    copy_upload: "User uploaded a copy for evaluation",
    news_read: "User read a news article",
    quiz_taken: "User completed a quiz",
    test_completed: "User completed a mock test",
  };
  return descriptions[activityType] || `User performed ${activityType}`;
}
