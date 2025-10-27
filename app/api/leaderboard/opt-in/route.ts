import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { optIn } = body;

    if (typeof optIn !== "boolean") {
      return NextResponse.json(
        { error: "Invalid opt-in value" },
        { status: 400 }
      );
    }

    // Check if preferences exist
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (!prefs) {
      // Create preferences with opt-in status
      await db.insert(userPreferences).values({
        userId,
        leaderboardOptIn: optIn,
      });
    } else {
      // Update opt-in status
      await db
        .update(userPreferences)
        .set({ leaderboardOptIn: optIn })
        .where(eq(userPreferences.userId, userId));
    }

    return NextResponse.json({
      success: true,
      leaderboardOptIn: optIn,
    });
  } catch (error) {
    console.error("Failed to update opt-in status:", error);
    return NextResponse.json(
      { error: "Failed to update opt-in status" },
      { status: 500 }
    );
  }
}
