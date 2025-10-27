import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { notesService } from "@/lib/services/notes.service";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { noteId, action, customPrompt } = body;

    if (!noteId || !action) {
      return NextResponse.json(
        { error: "Note ID and action are required" },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = [
      "expand",
      "summarize",
      "add-examples",
      "create-mnemonics",
      "generate-questions",
      "custom",
    ];

    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Enhance note with AI
    const enhancedContent = await notesService.enhanceNoteWithAI(
      noteId,
      userId,
      {
        noteId,
        action,
        customPrompt,
      }
    );

    return NextResponse.json({ enhancedContent });
  } catch (error) {
    console.error("AI help error:", error);
    return NextResponse.json(
      { error: "Failed to enhance note with AI" },
      { status: 500 }
    );
  }
}
