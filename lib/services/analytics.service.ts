import { db } from "@/db";
import {
  userActivities,
  userPreferences,
  copyEvaluations,
  mockTestAttempts,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { EvaluationResult } from "@/lib/config/evaluation-prompts";

/**
 * Activity type for tracking
 */
export type ActivityType =
  | "chat_message"
  | "copy_upload"
  | "news_read"
  | "quiz_taken"
  | "test_completed";

/**
 * Weak area identification
 */
export interface WeakArea {
  subject: string;
  topic: string;
  averageScore: number;
  attemptCount: number;
  lastAttempt: Date;
  trend: "improving" | "declining" | "stable";
  trendPercentage: number; // Percentage change from first to last attempt
  firstScore: number;
  lastScore: number;
  allScores: number[]; // All scores for this topic
}

/**
 * Progress data for visualization
 */
export interface ProgressData {
  scoresTrend: ScoreTrendPoint[];
  subjectPerformance: SubjectPerformance[];
  overallStats: OverallStats;
}

export interface ScoreTrendPoint {
  date: Date;
  score: number;
  copyType: string;
}

export interface SubjectPerformance {
  subject: string;
  averageScore: number;
  attemptCount: number;
  improvement: number; // Percentage improvement
}

export interface OverallStats {
  totalEvaluations: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  currentStreak: number;
}

/**
 * Performance comparison with peers
 */
export interface PerformanceComparison {
  userPercentile: number;
  averageScoreComparison: number; // User score vs average
  streakComparison: number; // User streak vs average
  testsCompletedComparison: number; // User tests vs average
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  anonymousId: string; // Anonymized user ID
  totalPoints: number;
  rank: number;
  averageScore: number;
  streak: number;
  testsCompleted: number;
  evaluationsCompleted: number;
  isCurrentUser?: boolean;
}

/**
 * User rank information
 */
export interface UserRankInfo {
  rank: number;
  totalPoints: number;
  percentile: number;
  totalUsers: number;
}

/**
 * AnalyticsService - Service for tracking user progress and analytics
 */
export class AnalyticsService {
  /**
   * Track user activity
   * @param userId - User ID
   * @param activityType - Type of activity
   * @param activityData - Optional additional data
   */
  async trackActivity(
    userId: string,
    activityType: ActivityType,
    activityData?: Record<string, unknown>
  ) {
    try {
      await db.insert(userActivities).values({
        userId,
        activityType,
        activityData: activityData ? JSON.stringify(activityData) : null,
      });

      // Update streak after tracking activity
      await this.updateStreak(userId);
    } catch (error) {
      console.error("Failed to track activity:", error);
      // Don't throw error to avoid breaking main flow
    }
  }

  /**
   * Update user's daily streak
   * @param userId - User ID
   * @returns Updated streak count
   */
  async updateStreak(userId: string): Promise<number> {
    try {
      // Get user preferences
      const prefs = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);

      if (prefs.length === 0) {
        // Create default preferences
        await db.insert(userPreferences).values({
          userId,
          dailyStreak: 1,
          lastActivityDate: new Date(),
        });
        return 1;
      }

      const userPref = prefs[0];
      const now = new Date();
      const lastActivity = userPref.lastActivityDate;

      if (!lastActivity) {
        // First activity
        await db
          .update(userPreferences)
          .set({
            dailyStreak: 1,
            lastActivityDate: now,
          })
          .where(eq(userPreferences.userId, userId));
        return 1;
      }

      // Calculate days difference
      const daysDiff = Math.floor(
        (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      let newStreak = userPref.dailyStreak ?? 0;
      const oldStreak = newStreak;

      if (daysDiff === 0) {
        // Same day, no change
        return newStreak;
      } else if (daysDiff === 1) {
        // Consecutive day, increment streak
        newStreak = (userPref.dailyStreak ?? 0) + 1;
      } else {
        // Streak broken, reset to 1
        newStreak = 1;
      }

      await db
        .update(userPreferences)
        .set({
          dailyStreak: newStreak,
          lastActivityDate: now,
        })
        .where(eq(userPreferences.userId, userId));

      // Check for streak milestones and send notifications
      const milestones = [7, 30, 100];
      if (milestones.includes(newStreak) && newStreak !== oldStreak) {
        try {
          const { notificationService } = await import("@/lib/services/notification.service");
          await notificationService.createStreakMilestoneNotification(userId, newStreak);
        } catch (error) {
          console.error("Failed to send streak milestone notification:", error);
          // Don't fail the streak update if notification fails
        }
      }

      return newStreak;
    } catch (error) {
      console.error("Failed to update streak:", error);
      return 0;
    }
  }

  /**
   * Get weak areas for a user based on evaluation history
   * @param userId - User ID
   * @returns Array of weak areas with trend analysis
   */
  async getWeakAreas(userId: string): Promise<WeakArea[]> {
    try {
      // Get all completed evaluations ordered by creation date (oldest first for trend analysis)
      const evaluations = await db
        .select()
        .from(copyEvaluations)
        .where(
          and(
            eq(copyEvaluations.userId, userId),
            eq(copyEvaluations.status, "completed")
          )
        )
        .orderBy(copyEvaluations.createdAt);

      if (evaluations.length === 0) {
        return [];
      }

      // Parse evaluation results and extract weak areas with chronological scores
      const subjectScores: Map<
        string,
        { 
          scores: number[]; 
          lastAttempt: Date;
          firstScore: number;
          lastScore: number;
        }
      > = new Map();

      for (const evaluation of evaluations) {
        if (!evaluation.evaluationResult) continue;

        const result: EvaluationResult = JSON.parse(evaluation.evaluationResult);

        // Extract subjects from breakdown
        for (const item of result.breakdown) {
          const subject = item.criterion;
          const scorePercentage = (item.score / item.maxScore) * 100;

          if (!subjectScores.has(subject)) {
            subjectScores.set(subject, {
              scores: [scorePercentage],
              lastAttempt: evaluation.createdAt,
              firstScore: scorePercentage,
              lastScore: scorePercentage,
            });
          } else {
            const data = subjectScores.get(subject)!;
            data.scores.push(scorePercentage);
            data.lastScore = scorePercentage;
            if (evaluation.createdAt > data.lastAttempt) {
              data.lastAttempt = evaluation.createdAt;
            }
          }
        }
      }

      // Calculate weak areas (average score < 60%)
      const weakAreas: WeakArea[] = [];

      for (const [subject, data] of subjectScores.entries()) {
        const averageScore =
          data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;

        if (averageScore < 60) {
          // Calculate trend
          let trend: "improving" | "declining" | "stable" = "stable";
          let trendPercentage = 0;

          if (data.scores.length >= 2) {
            const scoreDiff = data.lastScore - data.firstScore;
            trendPercentage = Math.round(
              (scoreDiff / data.firstScore) * 100
            );

            if (scoreDiff > 5) {
              trend = "improving";
            } else if (scoreDiff < -5) {
              trend = "declining";
            }
          }

          weakAreas.push({
            subject,
            topic: subject, // For now, using subject as topic
            averageScore: Math.round(averageScore * 10) / 10,
            attemptCount: data.scores.length,
            lastAttempt: data.lastAttempt,
            trend,
            trendPercentage,
            firstScore: Math.round(data.firstScore * 10) / 10,
            lastScore: Math.round(data.lastScore * 10) / 10,
            allScores: data.scores.map(s => Math.round(s * 10) / 10),
          });
        }
      }

      // Sort by average score (lowest first)
      weakAreas.sort((a, b) => a.averageScore - b.averageScore);

      return weakAreas;
    } catch (error) {
      console.error("Failed to get weak areas:", error);
      throw new Error("Failed to get weak areas");
    }
  }

  /**
   * Get improved areas (previously weak, now strong)
   * @param userId - User ID
   * @returns Array of improved areas
   */
  async getImprovedAreas(userId: string): Promise<WeakArea[]> {
    try {
      // Get all completed evaluations ordered by creation date
      const evaluations = await db
        .select()
        .from(copyEvaluations)
        .where(
          and(
            eq(copyEvaluations.userId, userId),
            eq(copyEvaluations.status, "completed")
          )
        )
        .orderBy(copyEvaluations.createdAt);

      if (evaluations.length === 0) {
        return [];
      }

      // Parse evaluation results and track all subjects
      const subjectScores: Map<
        string,
        { 
          scores: number[]; 
          lastAttempt: Date;
          firstScore: number;
          lastScore: number;
        }
      > = new Map();

      for (const evaluation of evaluations) {
        if (!evaluation.evaluationResult) continue;

        const result: EvaluationResult = JSON.parse(evaluation.evaluationResult);

        for (const item of result.breakdown) {
          const subject = item.criterion;
          const scorePercentage = (item.score / item.maxScore) * 100;

          if (!subjectScores.has(subject)) {
            subjectScores.set(subject, {
              scores: [scorePercentage],
              lastAttempt: evaluation.createdAt,
              firstScore: scorePercentage,
              lastScore: scorePercentage,
            });
          } else {
            const data = subjectScores.get(subject)!;
            data.scores.push(scorePercentage);
            data.lastScore = scorePercentage;
            if (evaluation.createdAt > data.lastAttempt) {
              data.lastAttempt = evaluation.createdAt;
            }
          }
        }
      }

      // Find improved areas: started weak (< 60%) but now strong (> 70%)
      const improvedAreas: WeakArea[] = [];

      for (const [subject, data] of subjectScores.entries()) {
        if (data.scores.length < 2) continue;

        const averageScore =
          data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;

        // Check if it was weak initially but improved
        if (data.firstScore < 60 && data.lastScore > 70) {
          const trendPercentage = Math.round(
            ((data.lastScore - data.firstScore) / data.firstScore) * 100
          );

          improvedAreas.push({
            subject,
            topic: subject,
            averageScore: Math.round(averageScore * 10) / 10,
            attemptCount: data.scores.length,
            lastAttempt: data.lastAttempt,
            trend: "improving",
            trendPercentage,
            firstScore: Math.round(data.firstScore * 10) / 10,
            lastScore: Math.round(data.lastScore * 10) / 10,
            allScores: data.scores.map(s => Math.round(s * 10) / 10),
          });
        }
      }

      // Sort by improvement percentage (highest first)
      improvedAreas.sort((a, b) => b.trendPercentage - a.trendPercentage);

      return improvedAreas;
    } catch (error) {
      console.error("Failed to get improved areas:", error);
      throw new Error("Failed to get improved areas");
    }
  }

  /**
   * Get progress trends for a user
   * @param userId - User ID
   * @returns Progress data with trends and statistics
   */
  async getProgressTrends(userId: string): Promise<ProgressData> {
    try {
      // Get all completed evaluations
      const evaluations = await db
        .select()
        .from(copyEvaluations)
        .where(
          and(
            eq(copyEvaluations.userId, userId),
            eq(copyEvaluations.status, "completed")
          )
        )
        .orderBy(copyEvaluations.createdAt);

      // Build scores trend
      const scoresTrend: ScoreTrendPoint[] = evaluations
        .filter((e) => e.evaluationResult)
        .map((e) => {
          const result: EvaluationResult = JSON.parse(e.evaluationResult!);
          return {
            date: e.createdAt,
            score: result.totalScore,
            copyType: e.copyType,
          };
        });

      // Calculate subject performance
      const subjectScoresMap: Map<
        string,
        { scores: number[]; firstScore: number; lastScore: number }
      > = new Map();

      for (const evaluation of evaluations) {
        if (!evaluation.evaluationResult) continue;

        const result: EvaluationResult = JSON.parse(evaluation.evaluationResult);

        for (const item of result.breakdown) {
          const subject = item.criterion;
          const scorePercentage = (item.score / item.maxScore) * 100;

          if (!subjectScoresMap.has(subject)) {
            subjectScoresMap.set(subject, {
              scores: [],
              firstScore: scorePercentage,
              lastScore: scorePercentage,
            });
          }

          const data = subjectScoresMap.get(subject)!;
          data.scores.push(scorePercentage);
          data.lastScore = scorePercentage;
        }
      }

      const subjectPerformance: SubjectPerformance[] = Array.from(
        subjectScoresMap.entries()
      ).map(([subject, data]) => {
        const averageScore =
          data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
        const improvement =
          data.scores.length > 1
            ? ((data.lastScore - data.firstScore) / data.firstScore) * 100
            : 0;

        return {
          subject,
          averageScore: Math.round(averageScore * 10) / 10,
          attemptCount: data.scores.length,
          improvement: Math.round(improvement * 10) / 10,
        };
      });

      // Calculate overall stats
      const allScores = scoresTrend.map((s) => s.score);
      const totalEvaluations = allScores.length;
      const averageScore =
        totalEvaluations > 0
          ? allScores.reduce((sum, score) => sum + score, 0) / totalEvaluations
          : 0;
      const highestScore = totalEvaluations > 0 ? Math.max(...allScores) : 0;
      const lowestScore = totalEvaluations > 0 ? Math.min(...allScores) : 0;

      // Get current streak
      const prefs = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);
      const currentStreak = prefs.length > 0 ? (prefs[0].dailyStreak ?? 0) : 0;

      const overallStats: OverallStats = {
        totalEvaluations,
        averageScore: Math.round(averageScore * 10) / 10,
        highestScore,
        lowestScore,
        currentStreak,
      };

      return {
        scoresTrend,
        subjectPerformance,
        overallStats,
      };
    } catch (error) {
      console.error("Failed to get progress trends:", error);
      throw new Error("Failed to get progress trends");
    }
  }

  /**
   * Get performance comparison with peers (anonymized)
   * @param userId - User ID
   * @returns Performance comparison data
   */
  async getPerformanceComparison(userId: string): Promise<PerformanceComparison> {
    try {
      // Get user's stats
      const userProgress = await this.getProgressTrends(userId);
      const userAvgScore = userProgress.overallStats.averageScore;
      const userStreak = userProgress.overallStats.currentStreak;
      const userTestsCompleted = userProgress.overallStats.totalEvaluations;

      // Get all users' stats for comparison (anonymized)
      const allEvaluations = await db
        .select()
        .from(copyEvaluations)
        .where(eq(copyEvaluations.status, "completed"));

      // Calculate platform averages
      const userScores: Map<string, number[]> = new Map();

      for (const evaluation of allEvaluations) {
        if (!evaluation.evaluationResult) continue;

        const result: EvaluationResult = JSON.parse(evaluation.evaluationResult);
        const userId = evaluation.userId;

        if (!userScores.has(userId)) {
          userScores.set(userId, []);
        }

        userScores.get(userId)!.push(result.totalScore);
      }

      // Calculate average scores for all users
      const allUserAverages = Array.from(userScores.values()).map((scores) =>
        scores.reduce((sum, score) => sum + score, 0) / scores.length
      );

      const platformAvgScore =
        allUserAverages.length > 0
          ? allUserAverages.reduce((sum, avg) => sum + avg, 0) /
            allUserAverages.length
          : 0;

      // Calculate percentile
      const betterThanCount = allUserAverages.filter(
        (avg) => userAvgScore > avg
      ).length;
      const userPercentile =
        allUserAverages.length > 0
          ? (betterThanCount / allUserAverages.length) * 100
          : 50;

      // Get all streaks
      const allPrefs = await db.select().from(userPreferences);
      const allStreaks = allPrefs.map((p) => p.dailyStreak || 0);
      const platformAvgStreak =
        allStreaks.length > 0
          ? allStreaks.reduce((sum, streak) => sum + streak, 0) / allStreaks.length
          : 0;

      // Calculate tests completed comparison
      const allTestCounts = Array.from(userScores.values()).map(
        (scores) => scores.length
      );
      const platformAvgTests =
        allTestCounts.length > 0
          ? allTestCounts.reduce((sum, count) => sum + count, 0) /
            allTestCounts.length
          : 0;

      return {
        userPercentile: Math.round(userPercentile),
        averageScoreComparison: Math.round(
          ((userAvgScore - platformAvgScore) / platformAvgScore) * 100
        ),
        streakComparison: Math.round(
          ((userStreak - platformAvgStreak) / (platformAvgStreak || 1)) * 100
        ),
        testsCompletedComparison: Math.round(
          ((userTestsCompleted - platformAvgTests) / (platformAvgTests || 1)) * 100
        ),
      };
    } catch (error) {
      console.error("Failed to get performance comparison:", error);
      throw new Error("Failed to get performance comparison");
    }
  }

  /**
   * Get recent activities for a user
   * @param userId - User ID
   * @param limit - Number of activities to return
   * @returns Array of recent activities
   */
  async getRecentActivities(userId: string, limit: number = 10) {
    try {
      return await db
        .select()
        .from(userActivities)
        .where(eq(userActivities.userId, userId))
        .orderBy(desc(userActivities.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("Failed to get recent activities:", error);
      throw new Error("Failed to get recent activities");
    }
  }

  /**
   * Calculate leaderboard points for a user
   * Points = (average score * 0.4) + (streak * 0.2) + (tests completed * 0.2) + (evaluations * 0.2)
   * @param userId - User ID
   * @returns Total points
   */
  async calculateUserPoints(userId: string): Promise<number> {
    try {
      // Get user's evaluations
      const evaluations = await db
        .select()
        .from(copyEvaluations)
        .where(
          and(
            eq(copyEvaluations.userId, userId),
            eq(copyEvaluations.status, "completed")
          )
        );

      // Calculate average score
      let averageScore = 0;
      if (evaluations.length > 0) {
        const scores = evaluations
          .filter((e) => e.evaluationResult)
          .map((e) => {
            const result: EvaluationResult = JSON.parse(e.evaluationResult!);
            return result.totalScore;
          });

        averageScore =
          scores.length > 0
            ? scores.reduce((sum, score) => sum + score, 0) / scores.length
            : 0;
      }

      // Get user's streak
      const prefs = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);

      const streak = prefs.length > 0 ? (prefs[0].dailyStreak ?? 0) : 0;

      // Get mock test attempts
      const testAttempts = await db
        .select()
        .from(mockTestAttempts)
        .where(
          and(
            eq(mockTestAttempts.userId, userId),
            eq(mockTestAttempts.status, "completed")
          )
        );

      const testsCompleted = testAttempts.length;
      const evaluationsCompleted = evaluations.length;

      // Calculate total points
      // Average score (40%) + Streak (20%) + Tests (20%) + Evaluations (20%)
      const points =
        averageScore * 0.4 +
        streak * 0.2 +
        testsCompleted * 0.2 +
        evaluationsCompleted * 0.2;

      return Math.round(points * 100) / 100;
    } catch (error) {
      console.error("Failed to calculate user points:", error);
      return 0;
    }
  }

  /**
   * Generate leaderboard for all opted-in users
   * @param limit - Number of entries to return (default 100)
   * @returns Array of leaderboard entries
   */
  async generateLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    try {
      // Get all users who are opted-in to leaderboard
      const optedInUsers = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.leaderboardOptIn, true));

      const leaderboardData: Array<{
        userId: string;
        points: number;
        averageScore: number;
        streak: number;
        testsCompleted: number;
        evaluationsCompleted: number;
      }> = [];

      // Calculate points for each user
      for (const userPref of optedInUsers) {
        const userId = userPref.userId;

        // Get evaluations
        const evaluations = await db
          .select()
          .from(copyEvaluations)
          .where(
            and(
              eq(copyEvaluations.userId, userId),
              eq(copyEvaluations.status, "completed")
            )
          );

        // Calculate average score
        let averageScore = 0;
        if (evaluations.length > 0) {
          const scores = evaluations
            .filter((e) => e.evaluationResult)
            .map((e) => {
              const result: EvaluationResult = JSON.parse(e.evaluationResult!);
              return result.totalScore;
            });

          averageScore =
            scores.length > 0
              ? scores.reduce((sum, score) => sum + score, 0) / scores.length
              : 0;
        }

        const streak = userPref.dailyStreak ?? 0;

        // Get mock test attempts
        const testAttempts = await db
          .select()
          .from(mockTestAttempts)
          .where(
            and(
              eq(mockTestAttempts.userId, userId),
              eq(mockTestAttempts.status, "completed")
            )
          );

        const testsCompleted = testAttempts.length;
        const evaluationsCompleted = evaluations.length;

        // Calculate points
        const points =
          averageScore * 0.4 +
          streak * 0.2 +
          testsCompleted * 0.2 +
          evaluationsCompleted * 0.2;

        leaderboardData.push({
          userId,
          points: Math.round(points * 100) / 100,
          averageScore: Math.round(averageScore * 10) / 10,
          streak,
          testsCompleted,
          evaluationsCompleted,
        });
      }

      // Sort by points (descending)
      leaderboardData.sort((a, b) => b.points - a.points);

      // Create leaderboard entries with anonymized IDs and ranks
      const leaderboard: LeaderboardEntry[] = leaderboardData
        .slice(0, limit)
        .map((data, index) => ({
          anonymousId: this.anonymizeUserId(data.userId),
          totalPoints: data.points,
          rank: index + 1,
          averageScore: data.averageScore,
          streak: data.streak,
          testsCompleted: data.testsCompleted,
          evaluationsCompleted: data.evaluationsCompleted,
        }));

      return leaderboard;
    } catch (error) {
      console.error("Failed to generate leaderboard:", error);
      throw new Error("Failed to generate leaderboard");
    }
  }

  /**
   * Get user's rank and percentile
   * @param userId - User ID
   * @returns User rank information
   */
  async getUserRank(userId: string): Promise<UserRankInfo> {
    try {
      // Check if user is opted-in
      const prefs = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);

      if (prefs.length === 0 || !prefs[0].leaderboardOptIn) {
        throw new Error("User is not opted-in to leaderboard");
      }

      // Get all opted-in users
      const optedInUsers = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.leaderboardOptIn, true));

      // Calculate points for all users
      const userPoints: Array<{ userId: string; points: number }> = [];

      for (const userPref of optedInUsers) {
        const points = await this.calculateUserPoints(userPref.userId);
        userPoints.push({ userId: userPref.userId, points });
      }

      // Sort by points (descending)
      userPoints.sort((a, b) => b.points - a.points);

      // Find user's rank
      const userIndex = userPoints.findIndex((u) => u.userId === userId);
      const rank = userIndex + 1;
      const totalUsers = userPoints.length;
      const percentile = Math.round(((totalUsers - userIndex) / totalUsers) * 100);

      return {
        rank,
        totalPoints: userPoints[userIndex]?.points ?? 0,
        percentile,
        totalUsers,
      };
    } catch (error) {
      console.error("Failed to get user rank:", error);
      throw error;
    }
  }

  /**
   * Get resource suggestions for a weak area
   * @param subject - Subject/topic name
   * @returns Resource suggestions
   */
  async getResourceSuggestions(subject: string): Promise<{
    tips: Array<{ id: string; subject: string; content: string }>;
    templates: Array<{ id: string; title: string; questionType: string }>;
    mockTests: Array<{ id: string; title: string; syllabus: string[] }>;
    externalResources: Array<{ title: string; url: string; type: string }>;
  }> {
    try {
      const suggestions = {
        tips: [] as Array<{ id: string; subject: string; content: string }>,
        templates: [] as Array<{ id: string; title: string; questionType: string }>,
        mockTests: [] as Array<{ id: string; title: string; syllabus: string[] }>,
        externalResources: [] as Array<{ title: string; url: string; type: string }>,
      };

      // Get relevant tips from cache
      const { tipsCache, answerTemplates, mockTests } = await import("@/db/schema");
      const { sql } = await import("drizzle-orm");

      // Fetch tips related to the subject
      const tips = await db
        .select()
        .from(tipsCache)
        .where(sql`LOWER(${tipsCache.subject}) LIKE LOWER(${"%" + subject + "%"})`)
        .limit(3);

      suggestions.tips = tips.map((tip) => ({
        id: tip.id,
        subject: tip.subject,
        content: tip.content,
      }));

      // Fetch relevant templates
      const templates = await db
        .select()
        .from(answerTemplates)
        .limit(3);

      suggestions.templates = templates.map((template) => ({
        id: template.id,
        title: template.title,
        questionType: template.questionType,
      }));

      // Fetch relevant mock tests
      const tests = await db
        .select()
        .from(mockTests)
        .limit(3);

      suggestions.mockTests = tests.map((test) => ({
        id: test.id,
        title: test.title,
        syllabus: test.syllabus ? JSON.parse(test.syllabus) : [],
      }));

      // Add external resources based on subject
      suggestions.externalResources = this.getExternalResources(subject);

      return suggestions;
    } catch (error) {
      console.error("Failed to get resource suggestions:", error);
      return {
        tips: [],
        templates: [],
        mockTests: [],
        externalResources: [],
      };
    }
  }

  /**
   * Get external resource links for a subject
   * @param subject - Subject name
   * @returns Array of external resources
   */
  private getExternalResources(subject: string): Array<{
    title: string;
    url: string;
    type: string;
  }> {
    const subjectLower = subject.toLowerCase();
    const resources: Array<{ title: string; url: string; type: string }> = [];

    // Map common subjects to resources
    const resourceMap: Record<string, Array<{ title: string; url: string; type: string }>> = {
      "factual accuracy": [
        {
          title: "PIB - Press Information Bureau",
          url: "https://pib.gov.in/",
          type: "Official Source",
        },
        {
          title: "UPSC Official Website",
          url: "https://www.upsc.gov.in/",
          type: "Official Source",
        },
      ],
      "current affairs": [
        {
          title: "The Hindu - Current Affairs",
          url: "https://www.thehindu.com/",
          type: "News",
        },
        {
          title: "Indian Express - Explained",
          url: "https://indianexpress.com/section/explained/",
          type: "News",
        },
      ],
      "content coverage": [
        {
          title: "NCERT Books Online",
          url: "https://ncert.nic.in/textbook.php",
          type: "Study Material",
        },
        {
          title: "UPSC Syllabus",
          url: "https://www.upsc.gov.in/syllabuses",
          type: "Official Source",
        },
      ],
      "presentation": [
        {
          title: "UPSC Answer Writing Guide",
          url: "https://www.upsc.gov.in/",
          type: "Guide",
        },
      ],
      "analytical depth": [
        {
          title: "Yojana Magazine",
          url: "https://yojana.gov.in/",
          type: "Magazine",
        },
        {
          title: "Economic Survey",
          url: "https://www.indiabudget.gov.in/",
          type: "Official Source",
        },
      ],
    };

    // Find matching resources
    for (const [key, value] of Object.entries(resourceMap)) {
      if (subjectLower.includes(key)) {
        resources.push(...value);
      }
    }

    // Default resources if no specific match
    if (resources.length === 0) {
      resources.push(
        {
          title: "UPSC Official Website",
          url: "https://www.upsc.gov.in/",
          type: "Official Source",
        },
        {
          title: "NCERT Books",
          url: "https://ncert.nic.in/textbook.php",
          type: "Study Material",
        }
      );
    }

    return resources;
  }

  /**
   * Anonymize user ID for leaderboard display
   * @param userId - User ID
   * @returns Anonymized ID
   */
  private anonymizeUserId(userId: string): string {
    // Create a simple hash-based anonymization
    // In production, you might want to use a more sophisticated method
    const hash = userId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `User${hash % 10000}`;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
