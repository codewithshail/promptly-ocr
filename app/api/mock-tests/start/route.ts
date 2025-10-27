import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { mockTestService } from "@/lib/services/mock-test.service";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { testId } = body;

    if (!testId) {
      return NextResponse.json({ error: "Test ID is required" }, { status: 400 });
    }

    // Start the test attempt
    const attempt = await mockTestService.startTest(userId, testId);

    return NextResponse.json({ attemptId: attempt.id });
  } catch (error) {
    console.error("Failed to start test:", error);
    return NextResponse.json(
      { error: "Failed to start test" },
      { status: 500 }
    );
  }
}
