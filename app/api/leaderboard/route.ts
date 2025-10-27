import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { analyticsService } from "@/lib/services/analytics.service";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";

// Cache for leaderboard data (1 hour)
let leaderboardCache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is opted-in
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (!prefs || !prefs.leaderboardOptIn) {
      return NextResponse.json(
        { error: "User is not opted-in to leaderboard" },
        { status: 403 }
      );
    }

    // Get filter from query params
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all-time";

    // Check cache
    const now = Date.now();
    if (
      leaderboardCache &&
      now - leaderboardCache.timestamp < CACHE_DURATION
    ) {
      // Return cached data with user's rank
      const userRank = await analyticsService.getUserRank(userId);
      
      // Mark current user in leaderboard
      const leaderboard = leaderboardCache.data.map((entry: any) => ({
        ...entry,
        isCurrentUser: entry.userId === userId,
      }));

      return NextResponse.json({
        leaderboard,
        userRank,
        cached: true,
      });
    }

    // Generate fresh leaderboard
    const leaderboard = await analyticsService.generateLeaderboard(100);
    const userRank = await analyticsService.getUserRank(userId);

    // Mark current user in leaderboard
    const leaderboardWithUser = leaderboard.map((entry) => ({
      ...entry,
      isCurrentUser: entry.anonymousId === analyticsService["anonymizeUserId"](userId),
    }));

    // Update cache
    leaderboardCache = {
      data: leaderboard,
      timestamp: now,
    };

    return NextResponse.json({
      leaderboard: leaderboardWithUser,
      userRank,
      cached: false,
    });
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    
    if (error instanceof Error && error.message.includes("not opted-in")) {
      return NextResponse.json(
        { error: "User is not opted-in to leaderboard" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
