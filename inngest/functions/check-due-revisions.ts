import { inngest } from "@/lib/inngest/client";
import { db } from "@/db";
import { revisionSchedule } from "@/db/schema";
import { lte } from "drizzle-orm";
import { notificationService } from "@/lib/services/notification.service";

/**
 * Inngest function to check for due revisions and send notifications
 * Runs daily at 8 AM
 */
export const checkDueRevisions = inngest.createFunction(
  {
    id: "check-due-revisions",
    name: "Check Due Revisions and Send Notifications",
  },
  { cron: "0 8 * * *" }, // Every day at 8 AM
  async ({ step }) => {
    console.log("Checking for due revisions...");

    // Step 1: Get all due revisions
    const dueRevisions = await step.run("get-due-revisions", async () => {
      const now = new Date();

      const revisions = await db
        .select()
        .from(revisionSchedule)
        .where(lte(revisionSchedule.nextRevisionAt, now));

      console.log(`Found ${revisions.length} due revisions`);
      return revisions;
    });

    if (dueRevisions.length === 0) {
      console.log("No due revisions found");
      return { success: true, notificationsSent: 0 };
    }

    // Step 2: Group revisions by user
    const revisionsByUser = await step.run("group-by-user", async () => {
      const grouped = new Map<
        string,
        Array<{ topic: string; subject: string }>
      >();

      for (const revision of dueRevisions) {
        if (!grouped.has(revision.userId)) {
          grouped.set(revision.userId, []);
        }
        grouped.get(revision.userId)!.push({
          topic: revision.topic,
          subject: revision.subject,
        });
      }

      // Convert Map to array for serialization
      return Array.from(grouped.entries());
    });

    // Step 3: Send notifications to each user
    let totalNotifications = 0;
    await step.run("send-notifications", async () => {
      for (const [userId, revisions] of revisionsByUser) {
        try {
          // If user has multiple due revisions, send a summary notification
          if (revisions.length > 1) {
            await notificationService.createNotification(userId, {
              type: "revision_due",
              title: "Revisions Due",
              message: `You have ${revisions.length} topics due for revision`,
              link: "/revision",
              metadata: { count: revisions.length, revisions },
            });
            totalNotifications++;
          } else {
            // Send individual notification
            await notificationService.createRevisionDueNotification(
              userId,
              revisions[0].topic,
              revisions[0].subject
            );
            totalNotifications++;
          }

          console.log(
            `Sent notification to user ${userId} for ${revisions.length} revisions`
          );
        } catch (error) {
          console.error(
            `Failed to send notification to user ${userId}:`,
            error
          );
        }
      }
    });

    console.log(`Sent ${totalNotifications} notifications`);

    return {
      success: true,
      notificationsSent: totalNotifications,
      usersNotified: revisionsByUser.length,
    };
  }
);
