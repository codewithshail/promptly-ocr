import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { analyticsService } from "@/lib/services/analytics.service";

/**
 * GET /api/analytics/improved-areas
 * Get improved areas (previously weak, now strong) for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get improved areas
    const improvedAreas = await analyticsService.getImprovedAreas(userId);

    return NextResponse.json({
      improvedAreas,
      count: improvedAreas.length,
    });
  } catch (error) {
    console.error("Failed to get improved areas:", error);
    return NextResponse.json(
      { error: "Failed to get improved areas" },
      { status: 500 }
    );
  }
}
