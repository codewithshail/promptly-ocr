import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { copyEvaluations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";

export async function POST(
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
      .select()
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

    // Update status to pending
    await db
      .update(copyEvaluations)
      .set({
        status: "pending",
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(copyEvaluations.id, id));

    // Trigger Inngest job to reprocess
    await inngest.send({
      name: "copy/uploaded",
      data: {
        copyId: submission.id,
        fileUrl: submission.fileUrl,
        copyType: submission.copyType,
        userId: submission.userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error retrying submission:", error);
    return NextResponse.json(
      { error: "Failed to retry submission" },
      { status: 500 }
    );
  }
}
