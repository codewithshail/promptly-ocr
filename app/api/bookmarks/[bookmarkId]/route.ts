import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { bookmarkService } from "@/lib/services/bookmark.service";

/**
 * DELETE /api/bookmarks/[bookmarkId]
 * Remove a bookmark
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { bookmarkId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookmarkId } = params;

    if (!bookmarkId) {
      return NextResponse.json(
        { error: "Bookmark ID is required" },
        { status: 400 }
      );
    }

    await bookmarkService.removeBookmark(bookmarkId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    return NextResponse.json(
      { error: "Failed to delete bookmark" },
      { status: 500 }
    );
  }
}
