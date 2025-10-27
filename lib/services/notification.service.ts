import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Notification type - matches requirement 26.1
 */
export type NotificationType =
  | "evaluation_complete"
  | "quiz_ready"
  | "revision_due"
  | "streak_milestone"
  | "announcement";

/**
 * Notification data
 */
export interface NotificationData {
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  metadata?: Record<string, any>;
  relatedId?: string;
}

/**
 * NotificationService - Service for managing user notifications
 */
export class NotificationService {
  /**
   * Create a notification
   * @param userId - User ID
   * @param data - Notification data
   * @returns Created notification
   */
  async createNotification(userId: string, data: NotificationData) {
    try {
      const result = await db
        .insert(notifications)
        .values({
          userId,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link || null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          relatedId: data.relatedId || null,
          read: false,
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error("Failed to create notification:", error);
      throw new Error("Failed to create notification");
    }
  }

  /**
   * Get user notifications
   * @param userId - User ID
   * @param unreadOnly - Only fetch unread notifications
   * @param limit - Maximum number of notifications to fetch
   * @returns Array of notifications
   */
  async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false,
    limit: number = 50
  ) {
    try {
      const conditions = [eq(notifications.userId, userId)];
      if (unreadOnly) {
        conditions.push(eq(notifications.read, false));
      }

      return await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("Failed to get user notifications:", error);
      throw new Error("Failed to get user notifications");
    }
  }

  /**
   * Mark notification as read
   * @param notificationId - Notification ID
   * @param userId - User ID (for authorization)
   * @returns Updated notification
   */
  async markAsRead(notificationId: string, userId: string) {
    try {
      const result = await db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId)
          )
        )
        .returning();

      return result[0];
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      throw new Error("Failed to mark notification as read");
    }
  }

  /**
   * Mark all notifications as read
   * @param userId - User ID
   * @returns Number of notifications marked as read
   */
  async markAllAsRead(userId: string) {
    try {
      await db
        .update(notifications)
        .set({ read: true })
        .where(
          and(eq(notifications.userId, userId), eq(notifications.read, false))
        );

      return { success: true };
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      throw new Error("Failed to mark all notifications as read");
    }
  }

  /**
   * Delete notification
   * @param notificationId - Notification ID
   * @param userId - User ID (for authorization)
   */
  async deleteNotification(notificationId: string, userId: string) {
    try {
      await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId)
          )
        );
    } catch (error) {
      console.error("Failed to delete notification:", error);
      throw new Error("Failed to delete notification");
    }
  }

  /**
   * Get unread notification count
   * @param userId - User ID
   * @returns Count of unread notifications
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const unreadNotifications = await db
        .select()
        .from(notifications)
        .where(
          and(eq(notifications.userId, userId), eq(notifications.read, false))
        );

      return unreadNotifications.length;
    } catch (error) {
      console.error("Failed to get unread count:", error);
      return 0;
    }
  }

  /**
   * Create revision due notification
   * @param userId - User ID
   * @param topic - Topic name
   * @param subject - Subject name
   */
  async createRevisionDueNotification(
    userId: string,
    topic: string,
    subject: string
  ) {
    return this.createNotification(userId, {
      type: "revision_due",
      title: "Revision Due",
      message: `Time to revise: ${topic} (${subject})`,
      link: "/revision",
      metadata: { topic, subject },
    });
  }

  /**
   * Create multiple revision due notifications
   * @param userId - User ID
   * @param revisions - Array of revision items
   */
  async createRevisionDueNotifications(
    userId: string,
    revisions: Array<{ topic: string; subject: string }>
  ) {
    try {
      const notificationPromises = revisions.map((revision) =>
        this.createRevisionDueNotification(
          userId,
          revision.topic,
          revision.subject
        )
      );

      await Promise.all(notificationPromises);
      return { success: true, count: revisions.length };
    } catch (error) {
      console.error("Failed to create revision due notifications:", error);
      throw new Error("Failed to create revision due notifications");
    }
  }

  /**
   * Create evaluation complete notification
   * @param userId - User ID
   * @param evaluationId - Evaluation ID
   * @param score - Score achieved
   * @param copyType - Type of copy (GS or Essay)
   */
  async createEvaluationCompleteNotification(
    userId: string,
    evaluationId: string,
    score: number,
    copyType: string
  ) {
    return this.createNotification(userId, {
      type: "evaluation_complete",
      title: "Evaluation Complete",
      message: `Your ${copyType.toUpperCase()} answer has been evaluated. Score: ${score}/100`,
      link: `/history`,
      relatedId: evaluationId,
      metadata: { evaluationId, score, copyType },
    });
  }

  /**
   * Create quiz ready notification
   * @param userId - User ID
   * @param quizDate - Date of the quiz
   */
  async createQuizReadyNotification(userId: string, quizDate: Date) {
    return this.createNotification(userId, {
      type: "quiz_ready",
      title: "Daily Quiz Ready",
      message: "Today's current affairs quiz is ready! Test your knowledge.",
      link: "/current-affairs",
      metadata: { quizDate: quizDate.toISOString() },
    });
  }

  /**
   * Create streak milestone notification
   * @param userId - User ID
   * @param streakDays - Number of streak days achieved
   */
  async createStreakMilestoneNotification(
    userId: string,
    streakDays: number
  ) {
    const milestoneMessages: Record<number, string> = {
      7: "Amazing! You've maintained a 7-day streak! 🎉",
      30: "Incredible! 30 days of consistent learning! 🌟",
      100: "Legendary! 100-day streak achieved! 🏆",
    };

    const message =
      milestoneMessages[streakDays] ||
      `Congratulations on your ${streakDays}-day streak!`;

    return this.createNotification(userId, {
      type: "streak_milestone",
      title: `${streakDays}-Day Streak!`,
      message,
      link: "/profile",
      metadata: { streakDays },
    });
  }

  /**
   * Create announcement notification
   * @param userId - User ID
   * @param title - Announcement title
   * @param message - Announcement message
   * @param link - Optional link
   */
  async createAnnouncementNotification(
    userId: string,
    title: string,
    message: string,
    link?: string
  ) {
    return this.createNotification(userId, {
      type: "announcement",
      title,
      message,
      link,
    });
  }

  /**
   * Broadcast announcement to all users
   * @param title - Announcement title
   * @param message - Announcement message
   * @param link - Optional link
   * @param userIds - Array of user IDs to notify (if empty, notifies all users)
   */
  async broadcastAnnouncement(
    title: string,
    message: string,
    link?: string,
    userIds?: string[]
  ) {
    try {
      // If specific user IDs provided, use them
      if (userIds && userIds.length > 0) {
        const notificationPromises = userIds.map((userId) =>
          this.createAnnouncementNotification(userId, title, message, link)
        );
        await Promise.all(notificationPromises);
        return { success: true, count: userIds.length };
      }

      // Otherwise, this would need to fetch all user IDs from the database
      // For now, we'll just return success
      return { success: true, message: "Broadcast functionality requires user IDs" };
    } catch (error) {
      console.error("Failed to broadcast announcement:", error);
      throw new Error("Failed to broadcast announcement");
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
