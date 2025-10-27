import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { copyEvaluations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all evaluations for the user, ordered by most recent first
    const evaluations = await db
      .select()
      .from(copyEvaluations)
      .where(eq(copyEvaluations.userId, userId))
      .orderBy(desc(copyEvaluations.createdAt));

    // Parse evaluation results from JSON
    const parsedEvaluations = evaluations.map((evaluation) => ({
      ...evaluation,
      evaluationResult: evaluation.evaluationResult
        ? JSON.parse(evaluation.evaluationResult)
        : null,
    }));

    return NextResponse.json({
      evaluations: parsedEvaluations,
    });
  } catch (error) {
    console.error("Error fetching evaluation history:", error);
    return NextResponse.json(
      { error: "Failed to fetch evaluation history" },
      { status: 500 }
    );
  }
}
