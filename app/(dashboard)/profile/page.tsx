import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { copyEvaluations, userPreferences } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect("/sign-in");
  }

  // Fetch user preferences
  const [preferences] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId));

  // Fetch evaluation history
  const evaluations = await db
    .select()
    .from(copyEvaluations)
    .where(eq(copyEvaluations.userId, userId))
    .orderBy(desc(copyEvaluations.createdAt))
    .limit(10);

  // Parse preferences
  const newsCategories = preferences?.newsCategories
    ? JSON.parse(preferences.newsCategories)
    : [];
  const thinkingModeDefault = preferences?.thinkingModeDefault || false;
  const notificationSettings = preferences?.notificationSettings
    ? JSON.parse(preferences.notificationSettings)
    : {};
  const dailyStreak = preferences?.dailyStreak || 0;
  const lastActivityDate = preferences?.lastActivityDate;
  const leaderboardOptIn = preferences?.leaderboardOptIn ?? true; // Default to opted-in
  const emailWelcome = preferences?.emailWelcome ?? true;
  const emailCopyComplete = preferences?.emailCopyComplete ?? true;
  const emailDailyDigest = preferences?.emailDailyDigest ?? true;
  const emailAnnouncements = preferences?.emailAnnouncements ?? true;

  // Calculate statistics from evaluations
  const completedEvaluations = evaluations.filter(
    (e) => e.status === "completed"
  );
  const totalEvaluations = completedEvaluations.length;

  let averageScore = 0;
  if (totalEvaluations > 0) {
    const scores = completedEvaluations
      .map((e) => {
        if (e.evaluationResult) {
          try {
            const result = JSON.parse(e.evaluationResult);
            return result.totalScore || 0;
          } catch {
            return 0;
          }
        }
        return 0;
      })
      .filter((score) => score > 0);

    if (scores.length > 0) {
      averageScore = Math.round(
        scores.reduce((a, b) => a + b, 0) / scores.length
      );
    }
  }

  return (
    <ProfileClient
      user={{
        id: userId,
        email: user.emailAddresses[0]?.emailAddress || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        imageUrl: user.imageUrl || "",
      }}
      preferences={{
        newsCategories,
        thinkingModeDefault,
        notificationSettings,
        dailyStreak,
        lastActivityDate: lastActivityDate?.toISOString() || null,
        leaderboardOptIn,
        emailWelcome,
        emailCopyComplete,
        emailDailyDigest,
        emailAnnouncements,
      }}
      stats={{
        totalEvaluations,
        averageScore,
        evaluations: completedEvaluations.map((e) => ({
          id: e.id,
          copyType: e.copyType,
          fileName: e.fileName,
          createdAt: e.createdAt.toISOString(),
          score: e.evaluationResult
            ? (() => {
                try {
                  const result = JSON.parse(e.evaluationResult);
                  return result.totalScore || 0;
                } catch {
                  return 0;
                }
              })()
            : 0,
        })),
      }}
    />
  );
}
