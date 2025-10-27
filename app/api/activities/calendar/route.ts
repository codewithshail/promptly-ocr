import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { userActivities } from "@/db/schema";
import { eq, gte, sql } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get activities from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Group activities by date and count them
    const activities = await db
      .select({
        date: sql<string>`DATE(${userActivities.createdAt})`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(userActivities)
      .where(
        eq(userActivities.userId, userId)
      )
      .groupBy(sql`DATE(${userActivities.createdAt})`)
      .orderBy(sql`DATE(${userActivities.createdAt})`);

    // Convert to the format expected by the calendar component
    const formattedActivities = activities.map((activity) => ({
      date: new Date(activity.date),
      count: activity.count,
    }));

    return NextResponse.json({ activities: formattedActivities });
  } catch (error) {
    console.error("Error fetching activity calendar:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity calendar" },
      { status: 500 }
    );
  }
}
