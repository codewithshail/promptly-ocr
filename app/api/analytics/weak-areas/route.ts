import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { analyticsService } from "@/lib/services/analytics.service";

/**
 * GET /api/analytics/weak-areas
 * Get weak areas for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get weak areas
    const weakAreas = await analyticsService.getWeakAreas(userId);

    // Get resource suggestions for each weak area
    const weakAreasWithResources = await Promise.all(
      weakAreas.map(async (area) => {
        try {
          const resources = await analyticsService.getResourceSuggestions(
            area.subject
          );
          return {
            ...area,
            resources,
          };
        } catch (error) {
          console.error(
            `Failed to get resources for ${area.subject}:`,
            error
          );
          return {
            ...area,
            resources: {
              tips: [],
              templates: [],
              mockTests: [],
              externalResources: [],
            },
          };
        }
      })
    );

    return NextResponse.json({
      weakAreas: weakAreasWithResources,
      count: weakAreas.length,
    });
  } catch (error) {
    console.error("Failed to get weak areas:", error);
    return NextResponse.json(
      { error: "Failed to get weak areas" },
      { status: 500 }
    );
  }
}
