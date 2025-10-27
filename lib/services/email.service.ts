import { resend, DEFAULT_FROM_EMAIL } from '@/lib/resend';
import { db } from '@/db';
import { emailLogs, userPreferences, copyEvaluations, newsArticles } from '@/db/schema';
import { eq, and, gte, lt } from 'drizzle-orm';
import WelcomeEmail from '@/emails/welcome-email';
import CopyCompleteEmail from '@/emails/copy-complete-email';
import DailyDigestEmail from '@/emails/daily-digest-email';
import AnnouncementEmail from '@/emails/announcement-email';

// Email types
export type EmailType = 'welcome' | 'copy_complete' | 'daily_digest' | 'announcement';

// Email service class
export class EmailService {
  private appUrl: string;

  constructor() {
    this.appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  /**
   * Check if user has email notifications enabled for a specific type
   */
  private async checkEmailPreference(
    userId: string,
    emailType: EmailType
  ): Promise<boolean> {
    try {
      const preferences = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);

      if (preferences.length === 0) {
        // If no preferences exist, default to enabled
        return true;
      }

      const pref = preferences[0];

      switch (emailType) {
        case 'welcome':
          return pref.emailWelcome ?? true;
        case 'copy_complete':
          return pref.emailCopyComplete ?? true;
        case 'daily_digest':
          return pref.emailDailyDigest ?? true;
        case 'announcement':
          return pref.emailAnnouncements ?? true;
        default:
          return true;
      }
    } catch (error) {
      console.error('Error checking email preference:', error);
      // Default to enabled if there's an error
      return true;
    }
  }

  /**
   * Log email to database
   */
  private async logEmail({
    userId,
    emailType,
    recipient,
    subject,
    status,
    resendId,
    errorMessage,
    metadata,
  }: {
    userId?: string;
    emailType: EmailType;
    recipient: string;
    subject: string;
    status: 'sent' | 'failed' | 'pending';
    resendId?: string;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await db.insert(emailLogs).values({
        userId: userId || null,
        emailType,
        recipient,
        subject,
        status,
        resendId: resendId || null,
        errorMessage: errorMessage || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });
    } catch (error) {
      console.error('Error logging email:', error);
      // Don't throw - logging failure shouldn't break email sending
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail({
    userId,
    userEmail,
    userName,
  }: {
    userId: string;
    userEmail: string;
    userName: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user has welcome emails enabled
      const isEnabled = await this.checkEmailPreference(userId, 'welcome');
      if (!isEnabled) {
        console.log(`Welcome email disabled for user ${userId}`);
        return { success: true }; // Return success but don't send
      }

      const subject = 'Welcome to UPSC Aspirant Platform! 🎓';

      // Send email
      const { data, error } = await resend.emails.send({
        from: DEFAULT_FROM_EMAIL,
        to: userEmail,
        subject,
        react: WelcomeEmail({
          userName,
          appUrl: this.appUrl,
        }),
      });

      if (error) {
        console.error('Resend error:', error);
        await this.logEmail({
          userId,
          emailType: 'welcome',
          recipient: userEmail,
          subject,
          status: 'failed',
          errorMessage: error.message,
        });
        return { success: false, error: error.message };
      }

      // Log successful email
      await this.logEmail({
        userId,
        emailType: 'welcome',
        recipient: userEmail,
        subject,
        status: 'sent',
        resendId: data?.id,
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.logEmail({
        userId,
        emailType: 'welcome',
        recipient: userEmail,
        subject: 'Welcome to UPSC Aspirant Platform! 🎓',
        status: 'failed',
        errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send copy evaluation complete email
   */
  async sendCopyCompleteEmail({
    userId,
    userEmail,
    userName,
    copyId,
  }: {
    userId: string;
    userEmail: string;
    userName: string;
    copyId: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user has copy complete emails enabled
      const isEnabled = await this.checkEmailPreference(userId, 'copy_complete');
      if (!isEnabled) {
        console.log(`Copy complete email disabled for user ${userId}`);
        return { success: true }; // Return success but don't send
      }

      // Fetch copy evaluation details
      const evaluation = await db
        .select()
        .from(copyEvaluations)
        .where(eq(copyEvaluations.id, copyId))
        .limit(1);

      if (evaluation.length === 0) {
        return { success: false, error: 'Copy evaluation not found' };
      }

      const copy = evaluation[0];
      const evaluationResult = copy.evaluationResult
        ? JSON.parse(copy.evaluationResult)
        : null;

      if (!evaluationResult) {
        return { success: false, error: 'Evaluation result not available' };
      }

      // Extract key information
      const score = evaluationResult.totalScore || 0;
      const maxScore = evaluationResult.maxScore || 100;
      const copyType = copy.copyType as 'gs' | 'essay';

      // Extract strengths and improvements (limit to 2-3 each)
      const strengths = evaluationResult.strengths?.slice(0, 3) || [];
      const improvements = evaluationResult.improvements?.slice(0, 3) || [];

      const subject = `Your ${copyType === 'gs' ? 'General Studies' : 'Essay'} Evaluation is Ready! ✅`;
      const evaluationUrl = `${this.appUrl}/history?evaluation=${copyId}`;

      // Send email
      const { data, error } = await resend.emails.send({
        from: DEFAULT_FROM_EMAIL,
        to: userEmail,
        subject,
        react: CopyCompleteEmail({
          userName,
          copyType,
          score,
          maxScore,
          strengths,
          improvements,
          evaluationUrl,
          appUrl: this.appUrl,
        }),
      });

      if (error) {
        console.error('Resend error:', error);
        await this.logEmail({
          userId,
          emailType: 'copy_complete',
          recipient: userEmail,
          subject,
          status: 'failed',
          errorMessage: error.message,
          metadata: { copyId },
        });
        return { success: false, error: error.message };
      }

      // Log successful email
      await this.logEmail({
        userId,
        emailType: 'copy_complete',
        recipient: userEmail,
        subject,
        status: 'sent',
        resendId: data?.id,
        metadata: { copyId, score, maxScore },
      });

      // Update copy evaluation with notification timestamp
      await db
        .update(copyEvaluations)
        .set({ notifiedAt: new Date() })
        .where(eq(copyEvaluations.id, copyId));

      return { success: true };
    } catch (error) {
      console.error('Error sending copy complete email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.logEmail({
        userId,
        emailType: 'copy_complete',
        recipient: userEmail,
        subject: 'Your Answer Evaluation is Ready! ✅',
        status: 'failed',
        errorMessage,
        metadata: { copyId },
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send daily digest email with top news articles
   */
  async sendDailyDigest({
    userId,
    userEmail,
    userName,
  }: {
    userId: string;
    userEmail: string;
    userName: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user has daily digest emails enabled
      const isEnabled = await this.checkEmailPreference(userId, 'daily_digest');
      if (!isEnabled) {
        console.log(`Daily digest email disabled for user ${userId}`);
        return { success: true }; // Return success but don't send
      }

      // Fetch user preferences
      const preferences = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);

      const hasPreferences = preferences.length > 0 && !!preferences[0].newsCategories;
      const preferredCategories = hasPreferences
        ? JSON.parse(preferences[0].newsCategories || '[]')
        : [];

      // Fetch recent news articles (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let articles = await db
        .select()
        .from(newsArticles)
        .where(gte(newsArticles.publishedAt, yesterday))
        .orderBy(newsArticles.publishedAt)
        .limit(20);

      // Filter and prioritize based on preferences
      let selectedArticles = [];
      if (hasPreferences && preferredCategories.length > 0) {
        // Get preferred articles first
        const preferredArticles = articles.filter((article) =>
          preferredCategories.includes(article.category)
        );
        // Get other articles
        const otherArticles = articles.filter(
          (article) => !preferredCategories.includes(article.category)
        );

        // Mix: 5 preferred + 2 other
        selectedArticles = [
          ...preferredArticles.slice(0, 5),
          ...otherArticles.slice(0, 2),
        ];
      } else {
        // No preferences, just take top 7
        selectedArticles = articles.slice(0, 7);
      }

      // Format articles for email
      const formattedArticles = selectedArticles.map((article) => ({
        id: article.id,
        title: article.title,
        summary: article.summary || '',
        category: article.category,
        source: article.source,
        publishedAt: article.publishedAt.toISOString(),
      }));

      const subject = `Your Daily Current Affairs Digest - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

      // Send email
      const { data, error } = await resend.emails.send({
        from: DEFAULT_FROM_EMAIL,
        to: userEmail,
        subject,
        react: DailyDigestEmail({
          userName,
          date: new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          articles: formattedArticles,
          hasPreferences,
          appUrl: this.appUrl,
        }),
      });

      if (error) {
        console.error('Resend error:', error);
        await this.logEmail({
          userId,
          emailType: 'daily_digest',
          recipient: userEmail,
          subject,
          status: 'failed',
          errorMessage: error.message,
          metadata: { articlesCount: formattedArticles.length },
        });
        return { success: false, error: error.message };
      }

      // Log successful email
      await this.logEmail({
        userId,
        emailType: 'daily_digest',
        recipient: userEmail,
        subject,
        status: 'sent',
        resendId: data?.id,
        metadata: { articlesCount: formattedArticles.length },
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending daily digest email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.logEmail({
        userId,
        emailType: 'daily_digest',
        recipient: userEmail,
        subject: 'Your Daily Current Affairs Digest',
        status: 'failed',
        errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send announcement email to user(s)
   */
  async sendAnnouncement({
    userId,
    userEmail,
    userName,
    title,
    content,
    ctaText,
    ctaUrl,
  }: {
    userId?: string;
    userEmail: string;
    userName: string;
    title: string;
    content: string;
    ctaText?: string;
    ctaUrl?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user has announcement emails enabled (if userId provided)
      if (userId) {
        const isEnabled = await this.checkEmailPreference(userId, 'announcement');
        if (!isEnabled) {
          console.log(`Announcement email disabled for user ${userId}`);
          return { success: true }; // Return success but don't send
        }
      }

      const subject = title;

      // Send email
      const { data, error } = await resend.emails.send({
        from: DEFAULT_FROM_EMAIL,
        to: userEmail,
        subject,
        react: AnnouncementEmail({
          userName,
          title,
          content,
          ctaText,
          ctaUrl,
          appUrl: this.appUrl,
        }),
      });

      if (error) {
        console.error('Resend error:', error);
        await this.logEmail({
          userId,
          emailType: 'announcement',
          recipient: userEmail,
          subject,
          status: 'failed',
          errorMessage: error.message,
        });
        return { success: false, error: error.message };
      }

      // Log successful email
      await this.logEmail({
        userId,
        emailType: 'announcement',
        recipient: userEmail,
        subject,
        status: 'sent',
        resendId: data?.id,
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending announcement email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.logEmail({
        userId,
        emailType: 'announcement',
        recipient: userEmail,
        subject: title,
        status: 'failed',
        errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Retry failed email
   */
  async retryFailedEmail(emailLogId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Fetch email log
      const logs = await db
        .select()
        .from(emailLogs)
        .where(eq(emailLogs.id, emailLogId))
        .limit(1);

      if (logs.length === 0) {
        return { success: false, error: 'Email log not found' };
      }

      const log = logs[0];

      // Parse metadata
      const metadata = log.metadata ? JSON.parse(log.metadata) : {};

      // Retry based on email type
      switch (log.emailType) {
        case 'welcome':
          // Cannot retry welcome email without user details
          return { success: false, error: 'Cannot retry welcome email' };

        case 'copy_complete':
          if (!log.userId || !metadata.copyId) {
            return { success: false, error: 'Missing required data for retry' };
          }
          // Would need to fetch user details and retry
          return { success: false, error: 'Retry not implemented for copy_complete' };

        case 'daily_digest':
          if (!log.userId) {
            return { success: false, error: 'Missing user ID for retry' };
          }
          // Would need to fetch user details and retry
          return { success: false, error: 'Retry not implemented for daily_digest' };

        case 'announcement':
          // Would need original announcement details
          return { success: false, error: 'Retry not implemented for announcement' };

        default:
          return { success: false, error: 'Unknown email type' };
      }
    } catch (error) {
      console.error('Error retrying failed email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get email logs for a user
   */
  async getEmailLogs(
    userId: string,
    options?: {
      emailType?: EmailType;
      status?: 'sent' | 'failed' | 'pending';
      limit?: number;
    }
  ) {
    try {
      const logs = await db
        .select()
        .from(emailLogs)
        .where(eq(emailLogs.userId, userId))
        .orderBy(emailLogs.sentAt);

      // Apply filters
      let filteredLogs = logs;

      if (options?.emailType) {
        filteredLogs = filteredLogs.filter((log) => log.emailType === options.emailType);
      }

      if (options?.status) {
        filteredLogs = filteredLogs.filter((log) => log.status === options.status);
      }

      if (options?.limit) {
        filteredLogs = filteredLogs.slice(0, options.limit);
      }

      return filteredLogs;
    } catch (error) {
      console.error('Error fetching email logs:', error);
      return [];
    }
  }

  /**
   * Get email statistics for a user
   */
  async getEmailStats(userId: string) {
    try {
      const logs = await db
        .select()
        .from(emailLogs)
        .where(eq(emailLogs.userId, userId));

      const stats = {
        total: logs.length,
        sent: logs.filter((log) => log.status === 'sent').length,
        failed: logs.filter((log) => log.status === 'failed').length,
        pending: logs.filter((log) => log.status === 'pending').length,
        byType: {
          welcome: logs.filter((log) => log.emailType === 'welcome').length,
          copy_complete: logs.filter((log) => log.emailType === 'copy_complete').length,
          daily_digest: logs.filter((log) => log.emailType === 'daily_digest').length,
          announcement: logs.filter((log) => log.emailType === 'announcement').length,
        },
      };

      return stats;
    } catch (error) {
      console.error('Error fetching email stats:', error);
      return null;
    }
  }

  /**
   * Update email log status
   */
  async updateEmailStatus(
    emailLogId: string,
    status: 'sent' | 'failed' | 'pending',
    errorMessage?: string
  ): Promise<boolean> {
    try {
      await db
        .update(emailLogs)
        .set({
          status,
          errorMessage: errorMessage || null,
        })
        .where(eq(emailLogs.id, emailLogId));

      return true;
    } catch (error) {
      console.error('Error updating email status:', error);
      return false;
    }
  }

  /**
   * Delete old email logs (older than specified days)
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Get logs older than cutoff date (sentAt < cutoffDate)
      const oldLogs = await db
        .select()
        .from(emailLogs)
        .where(lt(emailLogs.sentAt, cutoffDate));

      // Delete them
      if (oldLogs.length > 0) {
        await db
          .delete(emailLogs)
          .where(lt(emailLogs.sentAt, cutoffDate));
      }

      return oldLogs.length;
    } catch (error) {
      console.error('Error cleaning up old email logs:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Helper functions for email logging

/**
 * Log email with retry logic
 */
export async function logEmailWithRetry(
  logData: {
    userId?: string;
    emailType: EmailType;
    recipient: string;
    subject: string;
    status: 'sent' | 'failed' | 'pending';
    resendId?: string;
    errorMessage?: string;
    metadata?: Record<string, any>;
  },
  maxRetries: number = 3
): Promise<boolean> {
  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts < maxRetries) {
    try {
      await db.insert(emailLogs).values({
        userId: logData.userId || null,
        emailType: logData.emailType,
        recipient: logData.recipient,
        subject: logData.subject,
        status: logData.status,
        resendId: logData.resendId || null,
        errorMessage: logData.errorMessage || null,
        metadata: logData.metadata ? JSON.stringify(logData.metadata) : null,
      });

      return true;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      attempts++;
      
      if (attempts < maxRetries) {
        // Exponential backoff: wait 2^attempts seconds
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }
  }

  console.error(`Failed to log email after ${maxRetries} attempts:`, lastError);
  return false;
}

/**
 * Get failed emails that need retry
 */
export async function getFailedEmailsForRetry(
  maxAge: number = 24 // hours
): Promise<any[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - maxAge);

    // Get all failed emails and filter in memory
    const allLogs = await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.status, 'failed'));

    const failedEmails = allLogs.filter((log) => {
      const sentAt = new Date(log.sentAt);
      return sentAt >= cutoffDate;
    });

    return failedEmails;
  } catch (error) {
    console.error('Error fetching failed emails:', error);
    return [];
  }
}

/**
 * Mark email as sent
 */
export async function markEmailAsSent(
  emailLogId: string,
  resendId: string
): Promise<boolean> {
  try {
    await db
      .update(emailLogs)
      .set({
        status: 'sent',
        resendId,
        errorMessage: null,
      })
      .where(eq(emailLogs.id, emailLogId));

    return true;
  } catch (error) {
    console.error('Error marking email as sent:', error);
    return false;
  }
}

/**
 * Mark email as failed
 */
export async function markEmailAsFailed(
  emailLogId: string,
  errorMessage: string
): Promise<boolean> {
  try {
    await db
      .update(emailLogs)
      .set({
        status: 'failed',
        errorMessage,
      })
      .where(eq(emailLogs.id, emailLogId));

    return true;
  } catch (error) {
    console.error('Error marking email as failed:', error);
    return false;
  }
}

/**
 * Get email delivery rate for monitoring
 */
export async function getEmailDeliveryRate(
  startDate: Date,
  endDate: Date
): Promise<{
  total: number;
  sent: number;
  failed: number;
  deliveryRate: number;
}> {
  try {
    // Get all logs and filter in memory
    const allLogs = await db.select().from(emailLogs);
    
    const logs = allLogs.filter((log) => {
      const sentAt = new Date(log.sentAt);
      return sentAt >= startDate && sentAt <= endDate;
    });

    const total = logs.length;
    const sent = logs.filter((log) => log.status === 'sent').length;
    const failed = logs.filter((log) => log.status === 'failed').length;
    const deliveryRate = total > 0 ? (sent / total) * 100 : 0;

    return {
      total,
      sent,
      failed,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
    };
  } catch (error) {
    console.error('Error calculating email delivery rate:', error);
    return {
      total: 0,
      sent: 0,
      failed: 0,
      deliveryRate: 0,
    };
  }
}

