import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { bookmarkService } from "@/lib/services/bookmark.service";
import { db } from "@/db";
import { bookmarks, newsArticles, tipsCache } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

/**
 * GET /api/bookmarks
 * Get all bookmarks for the authenticated user
 * Query params: type (optional) - 'news' or 'tip'
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") as "news" | "tip" | null;

    // Get bookmarks
    const userBookmarks = await bookmarkService.getUserBookmarks(
      userId,
      type || undefined
    );

    // Fetch related items
    const newsBookmarks = userBookmarks.filter((b) => b.itemType === "news");
    const tipBookmarks = userBookmarks.filter((b) => b.itemType === "tip");

    let newsItems: any[] = [];
    let tipItems: any[] = [];

    // Fetch news articles
    if (newsBookmarks.length > 0) {
      const newsIds = newsBookmarks.map((b) => b.itemId);
      newsItems = await db
        .select()
        .from(newsArticles)
        .where(inArray(newsArticles.id, newsIds));
    }

    // Fetch tips
    if (tipBookmarks.length > 0) {
      const tipIds = tipBookmarks.map((b) => b.itemId);
      tipItems = await db
        .select()
        .from(tipsCache)
        .where(inArray(tipsCache.id, tipIds));
    }

    // Create maps for quick lookup
    const newsMap = new Map(newsItems.map((item) => [item.id, item]));
    const tipMap = new Map(tipItems.map((item) => [item.id, item]));

    // Combine bookmarks with items
    const bookmarksWithItems = userBookmarks
      .map((bookmark) => {
        let item;
        if (bookmark.itemType === "news") {
          item = newsMap.get(bookmark.itemId);
        } else {
          item = tipMap.get(bookmark.itemId);
        }

        if (!item) return null;

        return {
          id: bookmark.id,
          userId: bookmark.userId,
          itemType: bookmark.itemType,
          itemId: bookmark.itemId,
          createdAt: bookmark.createdAt,
          item,
        };
      })
      .filter((b) => b !== null);

    return NextResponse.json({
      bookmarks: bookmarksWithItems,
      count: bookmarksWithItems.length,
    });
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookmarks
 * Create a new bookmark
 * Body: { itemType: 'news' | 'tip', itemId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { itemType, itemId } = body;

    if (!itemType || !itemId) {
      return NextResponse.json(
        { error: "itemType and itemId are required" },
        { status: 400 }
      );
    }

    if (itemType !== "news" && itemType !== "tip") {
      return NextResponse.json(
        { error: "itemType must be 'news' or 'tip'" },
        { status: 400 }
      );
    }

    const bookmark = await bookmarkService.addBookmark(userId, itemType, itemId);

    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (error) {
    console.error("Error creating bookmark:", error);
    return NextResponse.json(
      { error: "Failed to create bookmark" },
      { status: 500 }
    );
  }
}
