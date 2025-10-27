import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { mockTestService } from "@/lib/services/mock-test.service";
import { inngest } from "@/lib/inngest/client";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { attemptId, answers } = body;

    if (!attemptId || !answers) {
      return NextResponse.json(
        { error: "Attempt ID and answers are required" },
        { status: 400 }
      );
    }

    // Submit the test
    await mockTestService.submitTest(attemptId, userId, answers);

    // Calculate time spent
    const timeSpent = await mockTestService.calculateTimeSpent(attemptId);

    // Update time spent in database
    await mockTestService.updateTimeSpent(attemptId, timeSpent);

    // Trigger Inngest job for evaluation
    await inngest.send({
      name: "mock-test/evaluate",
      data: {
        attemptId,
        userId,
      },
    });

    return NextResponse.json({ 
      success: true,
      message: "Test submitted successfully. Evaluation in progress." 
    });
  } catch (error) {
    console.error("Failed to submit test:", error);
    return NextResponse.json(
      { error: "Failed to submit test" },
      { status: 500 }
    );
  }
}
