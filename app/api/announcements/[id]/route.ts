import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { announcements, users, userPreferences, emailLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isUserAdmin } from "@/lib/middleware/admin";
import { emailService } from "@/lib/services/email.service";

/**
 * PATCH /api/announcements/[id]
 * Update an announcement (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin access
    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const announcementId = params.id;

    // Fetch existing announcement
    const existing = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, announcementId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    const announcement = existing[0];

    // Cannot edit sent announcements
    if (announcement.status === "sent") {
      return NextResponse.json(
        { error: "Cannot edit sent announcements" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, content, targetAudience, scheduledFor, sendNow } = body;

    // Validate target audience if provided
    if (targetAudience && !["all", "active", "inactive"].includes(targetAudience)) {
      return NextResponse.json(
        { error: "Invalid target audience" },
        { status: 400 }
      );
    }

    // Determine new status
    let status = announcement.status;
    let sentAt = announcement.sentAt;

    if (sendNow) {
      status = "sent";
      sentAt = new Date();
    } else if (scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: "Scheduled date must be in the future" },
          { status: 400 }
        );
      }
      status = "scheduled";
    }

    // Update announcement
    const [updated] = await db
      .update(announcements)
      .set({
        title: title || announcement.title,
        content: content || announcement.content,
        targetAudience: targetAudience || announcement.targetAudience,
        status,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : announcement.scheduledFor,
        sentAt,
        updatedAt: new Date(),
      })
      .where(eq(announcements.id, announcementId))
      .returning();

    // If sending now, send emails immediately
    if (sendNow) {
      const finalTitle = title || announcement.title;
      const finalContent = content || announcement.content;
      const finalAudience = targetAudience || announcement.targetAudience;

      // Get target users
      const targetUsers = await getTargetUsers(finalAudience);

      // Send emails to all target users
      let successCount = 0;
      let failCount = 0;

      for (const user of targetUsers) {
        try {
          const result = await emailService.sendAnnouncement({
            userId: user.id,
            userEmail: user.email,
            userName: user.firstName || "UPSC Aspirant",
            title: finalTitle,
            content: finalContent,
          });

          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }

          // Log with announcement ID in metadata
          await db.insert(emailLogs).values({
            userId: user.id,
            emailType: "announcement",
            recipient: user.email,
            subject: finalTitle,
            status: result.success ? "sent" : "failed",
            errorMessage: result.error || null,
            metadata: JSON.stringify({ announcementId: updated.id }),
          });
        } catch (error) {
          console.error(`Error sending to ${user.email}:`, error);
          failCount++;
        }
      }

      console.log(
        `Announcement sent: ${successCount} success, ${failCount} failed`
      );
    }

    return NextResponse.json({
      announcement: updated,
      message: sendNow
        ? "Announcement sent successfully"
        : "Announcement updated successfully",
    });
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json(
      { error: "Failed to update announcement" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/announcements/[id]
 * Delete an announcement (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin access
    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const announcementId = params.id;

    // Fetch existing announcement
    const existing = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, announcementId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    const announcement = existing[0];

    // Cannot delete sent announcements
    if (announcement.status === "sent") {
      return NextResponse.json(
        { error: "Cannot delete sent announcements" },
        { status: 400 }
      );
    }

    // Delete announcement
    await db
      .delete(announcements)
      .where(eq(announcements.id, announcementId));

    return NextResponse.json({
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get target users based on audience type
 */
async function getTargetUsers(targetAudience: string) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  if (targetAudience === "all") {
    // Get all users
    return await db.select().from(users);
  } else if (targetAudience === "active") {
    // Get users with activity in last 7 days
    const allUsers = await db.select().from(users);
    const activeUsers = [];

    for (const user of allUsers) {
      const prefs = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, user.id))
        .limit(1);

      if (prefs.length > 0 && prefs[0].lastActivityDate) {
        if (new Date(prefs[0].lastActivityDate) >= sevenDaysAgo) {
          activeUsers.push(user);
        }
      }
    }

    return activeUsers;
  } else if (targetAudience === "inactive") {
    // Get users without activity in last 7 days
    const allUsers = await db.select().from(users);
    const inactiveUsers = [];

    for (const user of allUsers) {
      const prefs = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, user.id))
        .limit(1);

      if (prefs.length === 0 || !prefs[0].lastActivityDate) {
        inactiveUsers.push(user);
      } else if (new Date(prefs[0].lastActivityDate) < sevenDaysAgo) {
        inactiveUsers.push(user);
      }
    }

    return inactiveUsers;
  }

  return [];
}
