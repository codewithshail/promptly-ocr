import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { analyticsService, ActivityType } from "@/lib/services/analytics.service";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { activityType, activityData } = body;

    if (!activityType) {
      return NextResponse.json(
        { error: "Activity type is required" },
        { status: 400 }
      );
    }

    // Track the activity (this also updates streak)
    await analyticsService.trackActivity(
      userId,
      activityType as ActivityType,
      activityData
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking activity:", error);
    return NextResponse.json(
      { error: "Failed to track activity" },
      { status: 500 }
    );
  }
}
