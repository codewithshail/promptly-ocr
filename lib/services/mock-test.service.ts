import { db } from "@/db";
import { mockTests, mockTestAttempts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { geminiService } from "./gemini.service";

/**
 * Question structure for mock tests
 */
export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  marks: number;
}

/**
 * Mock test structure
 */
export interface MockTestData {
  title: string;
  description: string;
  duration: number;
  totalQuestions: number;
  syllabus: string[];
  questions: Question[];
}

/**
 * Test attempt with answers
 */
export interface TestAttemptData {
  testId: string;
  answers: Record<string, number>; // questionId -> selectedOption
}

/**
 * Evaluation result for mock test
 */
export interface MockTestEvaluationResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  questionResults: QuestionResult[];
}

export interface QuestionResult {
  questionId: string;
  question: string;
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  marks: number;
  explanation: string;
}

/**
 * MockTestService - Service for managing mock tests and evaluations
 */
export class MockTestService {
  /**
   * Get all available mock tests
   * @returns Array of mock tests
   */
  async getAvailableTests() {
    try {
      return await db.select().from(mockTests).orderBy(desc(mockTests.createdAt));
    } catch (error) {
      console.error("Failed to get available tests:", error);
      throw new Error("Failed to get available tests");
    }
  }

  /**
   * Get mock test by ID
   * @param testId - Test ID
   * @returns Mock test or null
   */
  async getTestById(testId: string) {
    try {
      const result = await db
        .select()
        .from(mockTests)
        .where(eq(mockTests.id, testId))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error("Failed to get test:", error);
      throw new Error("Failed to get test");
    }
  }

  /**
   * Start a new test attempt
   * @param userId - User ID
   * @param testId - Test ID
   * @returns Created test attempt
   */
  async startTest(userId: string, testId: string) {
    try {
      // Verify test exists
      const test = await this.getTestById(testId);
      if (!test) {
        throw new Error("Test not found");
      }

      // Create new attempt
      const result = await db
        .insert(mockTestAttempts)
        .values({
          userId,
          testId,
          answers: JSON.stringify({}),
          status: "in_progress",
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error("Failed to start test:", error);
      throw new Error("Failed to start test");
    }
  }

  /**
   * Submit test answers
   * @param attemptId - Attempt ID
   * @param userId - User ID (for authorization)
   * @param answers - User answers
   */
  async submitTest(
    attemptId: string,
    userId: string,
    answers: Record<string, number>
  ) {
    try {
      // Update attempt with answers and mark as completed
      await db
        .update(mockTestAttempts)
        .set({
          answers: JSON.stringify(answers),
          status: "completed",
          completedAt: new Date(),
        })
        .where(and(eq(mockTestAttempts.id, attemptId), eq(mockTestAttempts.userId, userId)));
    } catch (error) {
      console.error("Failed to submit test:", error);
      throw new Error("Failed to submit test");
    }
  }

  /**
   * Evaluate test attempt
   * @param attemptId - Attempt ID
   * @returns Evaluation result
   */
  async evaluateTest(attemptId: string): Promise<MockTestEvaluationResult> {
    try {
      // Get attempt
      const attempt = await db
        .select()
        .from(mockTestAttempts)
        .where(eq(mockTestAttempts.id, attemptId))
        .limit(1);

      if (attempt.length === 0) {
        throw new Error("Test attempt not found");
      }

      const attemptData = attempt[0];

      // Get test
      const test = await this.getTestById(attemptData.testId);
      if (!test) {
        throw new Error("Test not found");
      }

      // Parse questions and answers
      const questions: Question[] = JSON.parse(test.questions);
      const userAnswers: Record<string, number> = JSON.parse(attemptData.answers);

      // Evaluate each question
      let totalScore = 0;
      let maxScore = 0;
      let correctAnswers = 0;
      let incorrectAnswers = 0;
      let unanswered = 0;

      const questionResults: QuestionResult[] = questions.map((question) => {
        const userAnswer = userAnswers[question.id];
        const isCorrect = userAnswer === question.correctAnswer;
        const marks = isCorrect ? question.marks : 0;

        maxScore += question.marks;
        if (userAnswer === undefined) {
          unanswered++;
        } else if (isCorrect) {
          correctAnswers++;
          totalScore += marks;
        } else {
          incorrectAnswers++;
        }

        return {
          questionId: question.id,
          question: question.question,
          userAnswer: userAnswer ?? -1,
          correctAnswer: question.correctAnswer,
          isCorrect,
          marks,
          explanation: question.explanation,
        };
      });

      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

      const evaluationResult: MockTestEvaluationResult = {
        totalScore,
        maxScore,
        percentage,
        correctAnswers,
        incorrectAnswers,
        unanswered,
        questionResults,
      };

      // Update attempt with evaluation result
      await db
        .update(mockTestAttempts)
        .set({
          score: totalScore,
          evaluationResult: JSON.stringify(evaluationResult),
        })
        .where(eq(mockTestAttempts.id, attemptId));

      return evaluationResult;
    } catch (error) {
      console.error("Failed to evaluate test:", error);
      throw new Error("Failed to evaluate test");
    }
  }

  /**
   * Get test history for a user
   * @param userId - User ID
   * @param testId - Optional filter by test ID
   * @returns Array of test attempts
   */
  async getTestHistory(userId: string, testId?: string) {
    try {
      const conditions = [eq(mockTestAttempts.userId, userId)];
      if (testId) {
        conditions.push(eq(mockTestAttempts.testId, testId));
      }

      return await db
        .select()
        .from(mockTestAttempts)
        .where(and(...conditions))
        .orderBy(desc(mockTestAttempts.startedAt));
    } catch (error) {
      console.error("Failed to get test history:", error);
      throw new Error("Failed to get test history");
    }
  }

  /**
   * Get attempt by ID
   * @param attemptId - Attempt ID
   * @param userId - User ID (for authorization)
   * @returns Test attempt or null
   */
  async getAttemptById(attemptId: string, userId: string) {
    try {
      const result = await db
        .select()
        .from(mockTestAttempts)
        .where(
          and(eq(mockTestAttempts.id, attemptId), eq(mockTestAttempts.userId, userId))
        )
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error("Failed to get attempt:", error);
      throw new Error("Failed to get attempt");
    }
  }

  /**
   * Calculate time spent on test
   * @param attemptId - Attempt ID
   * @returns Time spent in seconds
   */
  async calculateTimeSpent(attemptId: string): Promise<number> {
    try {
      const attempt = await db
        .select()
        .from(mockTestAttempts)
        .where(eq(mockTestAttempts.id, attemptId))
        .limit(1);

      if (attempt.length === 0) {
        return 0;
      }

      const attemptData = attempt[0];
      if (!attemptData.completedAt) {
        return 0;
      }

      const startTime = attemptData.startedAt.getTime();
      const endTime = attemptData.completedAt.getTime();
      const timeSpentMs = endTime - startTime;

      return Math.floor(timeSpentMs / 1000);
    } catch (error) {
      console.error("Failed to calculate time spent:", error);
      return 0;
    }
  }

  /**
   * Update time spent on test
   * @param attemptId - Attempt ID
   * @param timeSpent - Time spent in seconds
   */
  async updateTimeSpent(attemptId: string, timeSpent: number) {
    try {
      await db
        .update(mockTestAttempts)
        .set({ timeSpent })
        .where(eq(mockTestAttempts.id, attemptId));
    } catch (error) {
      console.error("Failed to update time spent:", error);
      throw new Error("Failed to update time spent");
    }
  }
}

// Export singleton instance
export const mockTestService = new MockTestService();
