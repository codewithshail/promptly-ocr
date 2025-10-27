import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getOrCreateUserPreferences, updateUserPreferences } from "@/db/queries";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create user preferences with defaults
    const preferences = await getOrCreateUserPreferences(userId);

    return NextResponse.json({
      newsCategories: preferences.newsCategories
        ? JSON.parse(preferences.newsCategories)
        : [],
      thinkingModeDefault: preferences.thinkingModeDefault || false,
      notificationSettings: preferences.notificationSettings
        ? JSON.parse(preferences.notificationSettings)
        : {},
      dailyStreak: preferences.dailyStreak || 0,
      lastActivityDate: preferences.lastActivityDate,
      leaderboardOptIn: preferences.leaderboardOptIn ?? true,
      emailWelcome: preferences.emailWelcome ?? true,
      emailCopyComplete: preferences.emailCopyComplete ?? true,
      emailDailyDigest: preferences.emailDailyDigest ?? true,
      emailAnnouncements: preferences.emailAnnouncements ?? true,
    });
  } catch (error) {
    console.error("Failed to fetch preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Ensure preferences exist first
    await getOrCreateUserPreferences(userId);

    // Build update data
    const updateData: any = {};

    if (body.newsCategories !== undefined) {
      updateData.newsCategories = JSON.stringify(body.newsCategories);
    }

    if (body.thinkingModeDefault !== undefined) {
      updateData.thinkingModeDefault = body.thinkingModeDefault;
    }

    if (body.notificationSettings !== undefined) {
      updateData.notificationSettings = JSON.stringify(
        body.notificationSettings
      );
    }

    if (body.dailyStreak !== undefined) {
      updateData.dailyStreak = body.dailyStreak;
    }

    if (body.lastActivityDate !== undefined) {
      updateData.lastActivityDate = body.lastActivityDate;
    }

    if (body.leaderboardOptIn !== undefined) {
      updateData.leaderboardOptIn = body.leaderboardOptIn;
    }

    // Email preferences
    if (body.emailWelcome !== undefined) {
      updateData.emailWelcome = body.emailWelcome;
    }

    if (body.emailCopyComplete !== undefined) {
      updateData.emailCopyComplete = body.emailCopyComplete;
    }

    if (body.emailDailyDigest !== undefined) {
      updateData.emailDailyDigest = body.emailDailyDigest;
    }

    if (body.emailAnnouncements !== undefined) {
      updateData.emailAnnouncements = body.emailAnnouncements;
    }

    // Update preferences
    const updated = await updateUserPreferences(userId, updateData);

    return NextResponse.json({
      newsCategories: updated.newsCategories
        ? JSON.parse(updated.newsCategories)
        : [],
      thinkingModeDefault: updated.thinkingModeDefault || false,
      notificationSettings: updated.notificationSettings
        ? JSON.parse(updated.notificationSettings)
        : {},
      dailyStreak: updated.dailyStreak || 0,
      lastActivityDate: updated.lastActivityDate,
      leaderboardOptIn: updated.leaderboardOptIn ?? true,
      emailWelcome: updated.emailWelcome ?? true,
      emailCopyComplete: updated.emailCopyComplete ?? true,
      emailDailyDigest: updated.emailDailyDigest ?? true,
      emailAnnouncements: updated.emailAnnouncements ?? true,
    });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
