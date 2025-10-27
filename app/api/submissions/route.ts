import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { copyEvaluations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all submissions for the user
    const submissions = await db
      .select({
        id: copyEvaluations.id,
        fileName: copyEvaluations.fileName,
        copyType: copyEvaluations.copyType,
        status: copyEvaluations.status,
        createdAt: copyEvaluations.createdAt,
        evaluationResult: copyEvaluations.evaluationResult,
        errorMessage: copyEvaluations.errorMessage,
      })
      .from(copyEvaluations)
      .where(eq(copyEvaluations.userId, userId))
      .orderBy(desc(copyEvaluations.createdAt));

    // Parse evaluation results to extract scores
    const formattedSubmissions = submissions.map((submission) => {
      let parsedResult = null;
      if (submission.evaluationResult && typeof submission.evaluationResult === 'string' && submission.evaluationResult.trim() !== '') {
        try {
          parsedResult = JSON.parse(submission.evaluationResult);
        } catch (e) {
          console.error("Error parsing evaluation result for submission", submission.id, ":", e);
          console.error("Invalid JSON:", submission.evaluationResult);
        }
      }

      return {
        id: submission.id,
        fileName: submission.fileName,
        copyType: submission.copyType,
        status: submission.status,
        createdAt: submission.createdAt,
        evaluationResult: parsedResult
          ? {
              totalScore: parsedResult.totalScore || 0,
              maxScore: parsedResult.maxScore || 100,
            }
          : undefined,
        errorMessage: submission.errorMessage,
      };
    });

    return NextResponse.json({ submissions: formattedSubmissions });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
