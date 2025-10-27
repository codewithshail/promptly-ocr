import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin";
import { db } from "@/db";
import { newsArticles, bookmarks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const articles = await db
      .select({
        id: newsArticles.id,
        title: newsArticles.title,
        summary: newsArticles.summary,
        content: newsArticles.content,
        source: newsArticles.source,
        category: newsArticles.category,
        imageUrl: newsArticles.imageUrl,
        publishedAt: newsArticles.publishedAt,
        fetchedAt: newsArticles.fetchedAt,
        externalUrl: newsArticles.externalUrl,
        bookmarkCount: sql<number>`count(${bookmarks.id})`,
      })
      .from(newsArticles)
      .leftJoin(
        bookmarks,
        sql`${bookmarks.itemType} = 'news' AND ${bookmarks.itemId} = ${newsArticles.id}`
      )
      .groupBy(newsArticles.id)
      .orderBy(sql`${newsArticles.publishedAt} DESC`)
      .limit(100);

    const formattedArticles = articles.map((article) => ({
      ...article,
      _count: {
        bookmarks: Number(article.bookmarkCount || 0),
      },
    }));

    return NextResponse.json({ articles: formattedArticles });
  } catch (error) {
    console.error("Error fetching news articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch news articles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const {
      title,
      summary,
      content,
      source,
      category,
      imageUrl,
      publishedAt,
      externalUrl,
    } = body;

    if (!title || !source || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [article] = await db
      .insert(newsArticles)
      .values({
        title,
        summary: summary || null,
        content: content || null,
        source,
        category,
        imageUrl: imageUrl || null,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        externalUrl: externalUrl || null,
      })
      .returning();

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error("Error creating news article:", error);
    return NextResponse.json(
      { error: "Failed to create news article" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Article ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, summary, content, source, category, imageUrl, externalUrl } =
      body;

    const [article] = await db
      .update(newsArticles)
      .set({
        title,
        summary: summary || null,
        content: content || null,
        source,
        category,
        imageUrl: imageUrl || null,
        externalUrl: externalUrl || null,
      })
      .where(eq(newsArticles.id, id))
      .returning();

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error("Error updating news article:", error);
    return NextResponse.json(
      { error: "Failed to update news article" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Article ID is required" },
        { status: 400 }
      );
    }

    await db.delete(newsArticles).where(eq(newsArticles.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting news article:", error);
    return NextResponse.json(
      { error: "Failed to delete news article" },
      { status: 500 }
    );
  }
}
