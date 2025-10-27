import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { revisionService } from "@/lib/services/revision.service";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const dueOnly = searchParams.get("dueOnly") === "true";

    let revisions;
    let dueRevisions;
    let stats;

    if (dueOnly) {
      // Only fetch due revisions
      dueRevisions = await revisionService.getDueRevisions(userId);
      return NextResponse.json({ dueRevisions });
    } else {
      // Fetch all data for the revision page
      revisions = await revisionService.getUserRevisions(userId, subject || undefined);
      dueRevisions = await revisionService.getDueRevisions(userId);
      stats = await revisionService.getRevisionStats(userId);

      return NextResponse.json({ revisions, dueRevisions, stats });
    }
  } catch (error) {
    console.error("Error fetching revisions:", error);
    return NextResponse.json(
      { error: "Failed to fetch revisions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topic, subject, difficulty } = await req.json();

    if (!topic || !subject) {
      return NextResponse.json(
        { error: "Topic and subject are required" },
        { status: 400 }
      );
    }

    const revision = await revisionService.addTopicToRevision(
      userId,
      topic,
      subject
    );

    return NextResponse.json({ revision });
  } catch (error) {
    console.error("Error creating revision:", error);
    return NextResponse.json(
      { error: "Failed to create revision" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { revisionId, difficulty } = await req.json();

    if (!revisionId || !difficulty) {
      return NextResponse.json(
        { error: "Revision ID and difficulty are required" },
        { status: 400 }
      );
    }

    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return NextResponse.json(
        { error: "Invalid difficulty level" },
        { status: 400 }
      );
    }

    const revision = await revisionService.markAsRevised(
      revisionId,
      userId,
      difficulty
    );

    return NextResponse.json({ revision });
  } catch (error) {
    console.error("Error updating revision:", error);
    return NextResponse.json(
      { error: "Failed to update revision" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const revisionId = searchParams.get("revisionId");

    if (!revisionId) {
      return NextResponse.json(
        { error: "Revision ID is required" },
        { status: 400 }
      );
    }

    await revisionService.deleteRevision(revisionId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting revision:", error);
    return NextResponse.json(
      { error: "Failed to delete revision" },
      { status: 500 }
    );
  }
}
