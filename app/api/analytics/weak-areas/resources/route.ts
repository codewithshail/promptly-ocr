import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { analyticsService } from "@/lib/services/analytics.service";

/**
 * GET /api/analytics/weak-areas/resources
 * Get resource suggestions for a specific subject
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const subject = searchParams.get("subject");

    if (!subject) {
      return NextResponse.json(
        { error: "Subject parameter is required" },
        { status: 400 }
      );
    }

    // Get resource suggestions
    const resources = await analyticsService.getResourceSuggestions(subject);

    return NextResponse.json(resources);
  } catch (error) {
    console.error("Failed to get resource suggestions:", error);
    return NextResponse.json(
      { error: "Failed to get resource suggestions" },
      { status: 500 }
    );
  }
}
