import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { flashcards } from "@/db/schema";
import { eq, and, lte, or, isNull } from "drizzle-orm";

/**
 * GET /api/flashcards
 * Get user's flashcards (due for review or all)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dueOnly = searchParams.get("dueOnly") === "true";

    const now = new Date();

    let userFlashcards;

    if (dueOnly) {
      // Get only flashcards due for review
      userFlashcards = await db
        .select()
        .from(flashcards)
        .where(
          and(
            eq(flashcards.userId, userId),
            or(
              lte(flashcards.nextReviewAt, now),
              isNull(flashcards.nextReviewAt)
            )
          )
        )
        .orderBy(flashcards.nextReviewAt);
    } else {
      // Get all flashcards
      userFlashcards = await db
        .select()
        .from(flashcards)
        .where(eq(flashcards.userId, userId))
        .orderBy(flashcards.createdAt);
    }

    // Calculate stats
    const allFlashcards = await db
      .select()
      .from(flashcards)
      .where(eq(flashcards.userId, userId));

    const dueFlashcards = allFlashcards.filter(
      (fc) => !fc.nextReviewAt || new Date(fc.nextReviewAt) <= now
    );

    const masteredFlashcards = allFlashcards.filter(
      (fc) => (fc.reviewCount || 0) >= 5 && (fc.easeFactor || 0) >= 250
    );

    const stats = {
      total: allFlashcards.length,
      dueToday: dueFlashcards.length,
      mastered: masteredFlashcards.length,
    };

    return NextResponse.json({
      flashcards: dueOnly ? dueFlashcards : userFlashcards,
      stats,
    });
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    return NextResponse.json(
      { error: "Failed to fetch flashcards" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/flashcards
 * Create new flashcards
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { flashcards: flashcardsData } = body;

    if (!Array.isArray(flashcardsData) || flashcardsData.length === 0) {
      return NextResponse.json(
        { error: "Invalid flashcards data" },
        { status: 400 }
      );
    }

    // Validate each flashcard
    for (const fc of flashcardsData) {
      if (!fc.question || !fc.answer) {
        return NextResponse.json(
          { error: "Each flashcard must have a question and answer" },
          { status: 400 }
        );
      }
    }

    // Insert flashcards
    const now = new Date();
    const insertData = flashcardsData.map((fc) => ({
      userId,
      question: fc.question,
      answer: fc.answer,
      sourceType: fc.sourceType || null,
      sourceId: fc.sourceId || null,
      nextReviewAt: now, // Available for immediate review
      easeFactor: 250, // Default ease factor
      reviewCount: 0,
    }));

    const created = await db
      .insert(flashcards)
      .values(insertData)
      .returning();

    return NextResponse.json({
      success: true,
      flashcards: created,
      count: created.length,
    });
  } catch (error) {
    console.error("Error creating flashcards:", error);
    return NextResponse.json(
      { error: "Failed to create flashcards" },
      { status: 500 }
    );
  }
}
