import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { flashcards } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/flashcards/review
 * Update flashcard review status with spaced repetition algorithm
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
    const { flashcardId, difficulty } = body;

    if (!flashcardId || !["easy", "medium", "hard"].includes(difficulty)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Get the flashcard
    const [flashcard] = await db
      .select()
      .from(flashcards)
      .where(
        and(
          eq(flashcards.id, flashcardId),
          eq(flashcards.userId, userId)
        )
      )
      .limit(1);

    if (!flashcard) {
      return NextResponse.json(
        { error: "Flashcard not found" },
        { status: 404 }
      );
    }

    // Calculate next review date using spaced repetition algorithm (SM-2)
    const now = new Date();
    let easeFactor = flashcard.easeFactor || 250;
    const currentReviewCount = flashcard.reviewCount || 0;
    let interval = 1; // days

    // Adjust ease factor based on difficulty
    if (difficulty === "easy") {
      easeFactor = Math.min(easeFactor + 15, 300); // Increase ease, max 300
      interval = calculateInterval(currentReviewCount + 1, easeFactor);
    } else if (difficulty === "medium") {
      // Keep ease factor the same
      interval = calculateInterval(currentReviewCount + 1, easeFactor);
    } else if (difficulty === "hard") {
      easeFactor = Math.max(easeFactor - 20, 130); // Decrease ease, min 130
      interval = 1; // Review again tomorrow
    }

    const nextReviewAt = new Date(now);
    nextReviewAt.setDate(nextReviewAt.getDate() + interval);

    // Update flashcard
    const [updated] = await db
      .update(flashcards)
      .set({
        lastReviewedAt: now,
        nextReviewAt,
        easeFactor,
        reviewCount: currentReviewCount + 1,
      })
      .where(eq(flashcards.id, flashcardId))
      .returning();

    return NextResponse.json({
      success: true,
      flashcard: updated,
      nextReviewIn: interval,
    });
  } catch (error) {
    console.error("Error updating flashcard review:", error);
    return NextResponse.json(
      { error: "Failed to update flashcard review" },
      { status: 500 }
    );
  }
}

/**
 * Calculate interval for next review using SM-2 algorithm
 * @param reviewCount - Number of times reviewed
 * @param easeFactor - Ease factor (130-300)
 * @returns Interval in days
 */
function calculateInterval(reviewCount: number, easeFactor: number): number {
  if (reviewCount === 1) {
    return 1; // 1 day
  } else if (reviewCount === 2) {
    return 3; // 3 days
  } else {
    // For subsequent reviews, use exponential growth based on ease factor
    const previousInterval = calculateInterval(reviewCount - 1, easeFactor);
    const factor = easeFactor / 100; // Convert to multiplier (1.3 - 3.0)
    return Math.round(previousInterval * factor);
  }
}
