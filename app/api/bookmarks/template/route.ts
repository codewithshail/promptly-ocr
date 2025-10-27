import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { bookmarkService } from "@/lib/services/bookmark.service";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = await request.json();
    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    const bookmark = await bookmarkService.createBookmark(
      userId,
      "template",
      templateId
    );

    return NextResponse.json(bookmark);
  } catch (error) {
    console.error("Error creating template bookmark:", error);
    return NextResponse.json(
      { error: "Failed to create bookmark" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = await request.json();
    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    await bookmarkService.deleteBookmark(userId, "template", templateId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template bookmark:", error);
    return NextResponse.json(
      { error: "Failed to delete bookmark" },
      { status: 500 }
    );
  }
}
