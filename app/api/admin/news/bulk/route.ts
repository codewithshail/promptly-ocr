import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin";
import { db } from "@/db";
import { newsArticles } from "@/db/schema";
import { inArray } from "drizzle-orm";

export async function DELETE(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Article IDs are required" },
        { status: 400 }
      );
    }

    await db.delete(newsArticles).where(inArray(newsArticles.id, ids));

    return NextResponse.json({ success: true, deletedCount: ids.length });
  } catch (error) {
    console.error("Error bulk deleting news articles:", error);
    return NextResponse.json(
      { error: "Failed to delete news articles" },
      { status: 500 }
    );
  }
}
