import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { announcements, users, userPreferences, emailLogs } from "@/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { isUserAdmin } from "@/lib/middleware/admin";
import { emailService } from "@/lib/services/email.service";

/**
 * GET /api/announcements
 * Get all announcements (admin only)
 */
export async function GET(request: NextRequest) {
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

    // Fetch all announcements
    const allAnnouncements = await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt));

    // Get recipient counts for sent announcements
    const announcementsWithCounts = await Promise.all(
      allAnnouncements.map(async (announcement) => {
        if (announcement.status === "sent") {
          // Count emails sent for this announcement
          const logs = await db
            .select()
            .from(emailLogs)
            .where(eq(emailLogs.emailType, "announcement"));

          // Filter by metadata containing announcement ID
          const relevantLogs = logs.filter((log) => {
            if (!log.metadata) return false;
            try {
              const metadata = JSON.parse(log.metadata);
              return metadata.announcementId === announcement.id;
            } catch {
              return false;
            }
          });

          return {
            ...announcement,
            recipientCount: relevantLogs.length,
          };
        }

        return announcement;
      })
    );

    return NextResponse.json({
      announcements: announcementsWithCounts,
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/announcements
 * Create a new announcement (admin only)
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { title, content, targetAudience, scheduledFor, sendNow } = body;

    // Validate required fields
    if (!title || !content || !targetAudience) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate target audience
    if (!["all", "active", "inactive"].includes(targetAudience)) {
      return NextResponse.json(
        { error: "Invalid target audience" },
        { status: 400 }
      );
    }

    // Determine status
    let status: "draft" | "scheduled" | "sent" = "draft";
    let sentAt = null;

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

    // Create announcement
    const [announcement] = await db
      .insert(announcements)
      .values({
        title,
        content,
        targetAudience,
        status,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        sentAt,
        createdBy: userId,
      })
      .returning();

    // If sending now, send emails immediately
    if (sendNow) {
      // Get target users
      const targetUsers = await getTargetUsers(targetAudience);

      // Send emails to all target users
      let successCount = 0;
      let failCount = 0;

      for (const user of targetUsers) {
        try {
          const result = await emailService.sendAnnouncement({
            userId: user.id,
            userEmail: user.email,
            userName: user.firstName || "UPSC Aspirant",
            title,
            content,
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
            subject: title,
            status: result.success ? "sent" : "failed",
            errorMessage: result.error || null,
            metadata: JSON.stringify({ announcementId: announcement.id }),
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
      announcement,
      message: sendNow
        ? "Announcement sent successfully"
        : status === "scheduled"
        ? "Announcement scheduled successfully"
        : "Announcement saved as draft",
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
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
