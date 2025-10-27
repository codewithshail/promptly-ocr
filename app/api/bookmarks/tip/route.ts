import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { bookmarks, tipsCache } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/bookmarks/tip
 * Create a bookmark for an individual tip
 * Creates a tipsCache entry for the individual tip if it doesn't exist
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, title, description, category, priority } = body;

    if (!subject || !title || !description || !category || !priority) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create a unique cache ID for this individual tip
    const individualTipCacheId = `individual-${subject}-${title
      .replace(/\s+/g, "-")
      .toLowerCase()}`;

    // Check if tipsCache entry already exists
    const existingCache = await db
      .select()
      .from(tipsCache)
      .where(eq(tipsCache.id, individualTipCacheId))
      .limit(1);

    let cacheId = individualTipCacheId;

    if (existingCache.length === 0) {
      // Create tipsCache entry for this individual tip
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 365); // 1 year expiry for individual tips

      const tipData = {
        title,
        description,
        category,
        priority,
      };

      const insertResult = await db
        .insert(tipsCache)
        .values({
          id: individualTipCacheId,
          subject,
          topic: "", // Individual tips don't have topics
          content: JSON.stringify([tipData]),
          sources: JSON.stringify([]),
          cachedAt: new Date(),
          expiresAt,
        })
        .returning();

      cacheId = insertResult[0]?.id || individualTipCacheId;
    }

    // Check if bookmark already exists
    const existingBookmark = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.itemType, "tip"),
          eq(bookmarks.itemId, cacheId)
        )
      )
      .limit(1);

    if (existingBookmark.length > 0) {
      return NextResponse.json({ bookmark: existingBookmark[0] });
    }

    // Create bookmark
    const result = await db
      .insert(bookmarks)
      .values({
        userId,
        itemType: "tip",
        itemId: cacheId,
      })
      .returning();

    return NextResponse.json({ bookmark: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating individual tip bookmark:", error);
    return NextResponse.json(
      { error: "Failed to create bookmark" },
      { status: 500 }
    );
  }
}
