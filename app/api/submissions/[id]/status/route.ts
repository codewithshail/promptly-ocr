import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { copyEvaluations } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the submission
    const [submission] = await db
      .select({
        id: copyEvaluations.id,
        status: copyEvaluations.status,
        createdAt: copyEvaluations.createdAt,
        updatedAt: copyEvaluations.updatedAt,
        errorMessage: copyEvaluations.errorMessage,
      })
      .from(copyEvaluations)
      .where(
        and(eq(copyEvaluations.id, id), eq(copyEvaluations.userId, userId))
      )
      .limit(1);

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Calculate progress percentage based on status
    let progress = 0;
    let currentStage = "";
    let estimatedTimeRemaining = 0; // in seconds

    switch (submission.status) {
      case "pending":
        progress = 10;
        currentStage = "queued";
        estimatedTimeRemaining = 180; // 3 minutes
        break;
      case "processing":
        // Calculate progress based on time elapsed
        const elapsedTime = Date.now() - new Date(submission.updatedAt).getTime();
        const elapsedSeconds = Math.floor(elapsedTime / 1000);
        
        // Assume processing takes about 120 seconds (2 minutes)
        // Progress from 10% to 90% during processing
        const processingProgress = Math.min((elapsedSeconds / 120) * 80, 80);
        progress = 10 + processingProgress;
        
        // Determine current stage based on elapsed time
        if (elapsedSeconds < 30) {
          currentStage = "extracting";
          estimatedTimeRemaining = 120 - elapsedSeconds;
        } else if (elapsedSeconds < 90) {
          currentStage = "evaluating";
          estimatedTimeRemaining = 120 - elapsedSeconds;
        } else {
          currentStage = "finalizing";
          estimatedTimeRemaining = Math.max(30, 120 - elapsedSeconds);
        }
        break;
      case "completed":
        progress = 100;
        currentStage = "completed";
        estimatedTimeRemaining = 0;
        break;
      case "failed":
        progress = 0;
        currentStage = "failed";
        estimatedTimeRemaining = 0;
        break;
      default:
        progress = 0;
        currentStage = "unknown";
        estimatedTimeRemaining = 0;
    }

    return NextResponse.json({
      id: submission.id,
      status: submission.status,
      progress: Math.round(progress),
      currentStage,
      estimatedTimeRemaining,
      errorMessage: submission.errorMessage,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching submission status:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission status" },
      { status: 500 }
    );
  }
}
