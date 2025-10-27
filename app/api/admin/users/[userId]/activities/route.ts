import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin";
import { db } from "@/db";
import { userActivities } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { userId } = params;

    const activities = await db
      .select()
      .from(userActivities)
      .where(eq(userActivities.userId, userId))
      .orderBy(sql`${userActivities.createdAt} DESC`)
      .limit(50);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error fetching user activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch user activities" },
      { status: 500 }
    );
  }
}
