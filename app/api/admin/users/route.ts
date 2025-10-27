import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin";
import { db } from "@/db";
import {
  users,
  userPreferences,
  copyEvaluations,
  mockTestAttempts,
  notes,
  userActivities,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        imageUrl: users.imageUrl,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        dailyStreak: userPreferences.dailyStreak,
        leaderboardOptIn: userPreferences.leaderboardOptIn,
      })
      .from(users)
      .leftJoin(userPreferences, eq(users.id, userPreferences.userId))
      .orderBy(sql`${users.createdAt} DESC`);

    // Get counts for each user
    const usersWithCounts = await Promise.all(
      allUsers.map(async (user) => {
        const [evaluationsCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(copyEvaluations)
          .where(eq(copyEvaluations.userId, user.id));

        const [testAttemptsCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(mockTestAttempts)
          .where(eq(mockTestAttempts.userId, user.id));

        const [notesCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(notes)
          .where(eq(notes.userId, user.id));

        const [activitiesCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(userActivities)
          .where(eq(userActivities.userId, user.id));

        return {
          ...user,
          preferences: {
            dailyStreak: user.dailyStreak || 0,
            leaderboardOptIn: user.leaderboardOptIn || false,
          },
          _count: {
            evaluations: Number(evaluationsCount?.count || 0),
            testAttempts: Number(testAttemptsCount?.count || 0),
            notes: Number(notesCount?.count || 0),
            activities: Number(activitiesCount?.count || 0),
          },
        };
      })
    );

    return NextResponse.json({ users: usersWithCounts });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
