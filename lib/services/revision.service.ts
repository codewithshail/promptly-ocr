import { db } from "@/db";
import { revisionSchedule } from "@/db/schema";
import { eq, and, lte, desc } from "drizzle-orm";

/**
 * Difficulty level for revision items
 */
export type RevisionDifficulty = "easy" | "medium" | "hard";

/**
 * Revision item data
 */
export interface RevisionItemData {
  topic: string;
  subject: string;
  difficulty?: RevisionDifficulty;
}

/**
 * RevisionService - Service for managing revision schedule with spaced repetition
 */
export class RevisionService {
  /**
   * Spaced repetition intervals in days
   * Based on difficulty level
   */
  private readonly intervals = {
    easy: [1, 3, 7, 15, 30, 60, 90],
    medium: [1, 2, 5, 10, 20, 40, 80],
    hard: [1, 1, 3, 7, 14, 28, 56],
  };

  /**
   * Add topic to revision schedule
   * @param userId - User ID
   * @param topic - Topic name
   * @param subject - Subject name
   * @returns Created revision item
   */
  async addTopicToRevision(
    userId: string,
    topic: string,
    subject: string
  ) {
    try {
      const now = new Date();
      const nextRevision = this.calculateNextRevision(now, 0, "medium");

      const result = await db
        .insert(revisionSchedule)
        .values({
          userId,
          topic,
          subject,
          lastRevisedAt: now,
          nextRevisionAt: nextRevision,
          revisionCount: 0,
          difficulty: "medium",
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error("Failed to add topic to revision:", error);
      throw new Error("Failed to add topic to revision");
    }
  }

  /**
   * Mark topic as revised
   * @param revisionId - Revision item ID
   * @param userId - User ID (for authorization)
   * @param difficulty - User-reported difficulty
   * @returns Updated revision item
   */
  async markAsRevised(
    revisionId: string,
    userId: string,
    difficulty: RevisionDifficulty
  ) {
    try {
      // Get current revision item
      const current = await db
        .select()
        .from(revisionSchedule)
        .where(
          and(eq(revisionSchedule.id, revisionId), eq(revisionSchedule.userId, userId))
        )
        .limit(1);

      if (current.length === 0) {
        throw new Error("Revision item not found");
      }

      const item = current[0];
      const now = new Date();
      const newRevisionCount = (item.revisionCount ?? 0) + 1;
      const nextRevision = this.calculateNextRevision(
        now,
        newRevisionCount,
        difficulty
      );

      // Update revision item
      const result = await db
        .update(revisionSchedule)
        .set({
          lastRevisedAt: now,
          nextRevisionAt: nextRevision,
          revisionCount: newRevisionCount,
          difficulty,
        })
        .where(
          and(eq(revisionSchedule.id, revisionId), eq(revisionSchedule.userId, userId))
        )
        .returning();

      return result[0];
    } catch (error) {
      console.error("Failed to mark as revised:", error);
      throw new Error("Failed to mark as revised");
    }
  }

  /**
   * Get due revisions for a user
   * @param userId - User ID
   * @returns Array of due revision items
   */
  async getDueRevisions(userId: string) {
    try {
      const now = new Date();

      return await db
        .select()
        .from(revisionSchedule)
        .where(
          and(
            eq(revisionSchedule.userId, userId),
            lte(revisionSchedule.nextRevisionAt, now)
          )
        )
        .orderBy(revisionSchedule.nextRevisionAt);
    } catch (error) {
      console.error("Failed to get due revisions:", error);
      throw new Error("Failed to get due revisions");
    }
  }

  /**
   * Get all revisions for a user
   * @param userId - User ID
   * @param subject - Optional filter by subject
   * @returns Array of revision items
   */
  async getUserRevisions(userId: string, subject?: string) {
    try {
      const conditions = [eq(revisionSchedule.userId, userId)];
      if (subject) {
        conditions.push(eq(revisionSchedule.subject, subject));
      }

      return await db
        .select()
        .from(revisionSchedule)
        .where(and(...conditions))
        .orderBy(revisionSchedule.nextRevisionAt);
    } catch (error) {
      console.error("Failed to get user revisions:", error);
      throw new Error("Failed to get user revisions");
    }
  }

  /**
   * Get upcoming revisions (next 7 days)
   * @param userId - User ID
   * @returns Array of upcoming revision items
   */
  async getUpcomingRevisions(userId: string) {
    try {
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      return await db
        .select()
        .from(revisionSchedule)
        .where(
          and(
            eq(revisionSchedule.userId, userId),
            lte(revisionSchedule.nextRevisionAt, sevenDaysLater)
          )
        )
        .orderBy(revisionSchedule.nextRevisionAt);
    } catch (error) {
      console.error("Failed to get upcoming revisions:", error);
      throw new Error("Failed to get upcoming revisions");
    }
  }

  /**
   * Delete revision item
   * @param revisionId - Revision item ID
   * @param userId - User ID (for authorization)
   */
  async deleteRevision(revisionId: string, userId: string) {
    try {
      await db
        .delete(revisionSchedule)
        .where(
          and(eq(revisionSchedule.id, revisionId), eq(revisionSchedule.userId, userId))
        );
    } catch (error) {
      console.error("Failed to delete revision:", error);
      throw new Error("Failed to delete revision");
    }
  }

  /**
   * Calculate next revision date using spaced repetition
   * @param lastRevised - Last revision date
   * @param revisionCount - Number of times revised
   * @param difficulty - Difficulty level
   * @returns Next revision date
   */
  calculateNextRevision(
    lastRevised: Date,
    revisionCount: number,
    difficulty: RevisionDifficulty
  ): Date {
    const intervals = this.intervals[difficulty];
    const intervalIndex = Math.min(revisionCount, intervals.length - 1);
    const daysToAdd = intervals[intervalIndex];

    const nextRevision = new Date(lastRevised);
    nextRevision.setDate(nextRevision.getDate() + daysToAdd);

    return nextRevision;
  }

  /**
   * Get revision statistics for a user
   * @param userId - User ID
   * @returns Revision statistics
   */
  async getRevisionStats(userId: string) {
    try {
      const allRevisions = await this.getUserRevisions(userId);
      const dueRevisions = await this.getDueRevisions(userId);

      const totalTopics = allRevisions.length;
      const dueTopics = dueRevisions.length;
      const completedTopics = allRevisions.filter((r) => (r.revisionCount ?? 0) > 0).length;

      // Calculate average revision count
      const totalRevisions = allRevisions.reduce(
        (sum, r) => sum + (r.revisionCount ?? 0),
        0
      );
      const avgRevisionsPerTopic =
        totalTopics > 0 ? totalRevisions / totalTopics : 0;

      // Group by difficulty
      const byDifficulty = {
        easy: allRevisions.filter((r) => r.difficulty === "easy").length,
        medium: allRevisions.filter((r) => r.difficulty === "medium").length,
        hard: allRevisions.filter((r) => r.difficulty === "hard").length,
      };

      return {
        totalTopics,
        dueTopics,
        completedTopics,
        avgRevisionsPerTopic: Math.round(avgRevisionsPerTopic * 10) / 10,
        byDifficulty,
      };
    } catch (error) {
      console.error("Failed to get revision stats:", error);
      throw new Error("Failed to get revision stats");
    }
  }
}

// Export singleton instance
export const revisionService = new RevisionService();
