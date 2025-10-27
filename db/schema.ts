import { pgTable, uuid, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";

// Users table - synced with Clerk authentication
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), // Clerk user ID
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  imageUrl: text("image_url"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  thinkingProcess: text("thinking_process"),
  thinkingModeUsed: boolean("thinking_mode_used").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Copy evaluations table (replaces prescriptions)
export const copyEvaluations = pgTable("copy_evaluations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  copyType: varchar("copy_type", { length: 20 }).notNull(), // 'gs' | 'essay'
  extractedText: text("extracted_text"),
  evaluationResult: text("evaluation_result"), // JSON
  status: varchar("status", { length: 20 }).notNull(), // 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage: text("error_message"),
  notifiedAt: timestamp("notified_at"), // When user was notified via email
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// News articles table
export const newsArticles = pgTable("news_articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  summary: text("summary"),
  content: text("content"),
  source: varchar("source", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  imageUrl: text("image_url"),
  publishedAt: timestamp("published_at").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  externalUrl: text("external_url"),
});

// User preferences table
export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  newsCategories: text("news_categories"), // JSON array
  thinkingModeDefault: boolean("thinking_mode_default").default(false),
  notificationSettings: text("notification_settings"), // JSON
  dailyStreak: integer("daily_streak").default(0),
  lastActivityDate: timestamp("last_activity_date"),
  leaderboardOptIn: boolean("leaderboard_opt_in").default(true).notNull(), // Default opted-in
  // Email preferences
  emailWelcome: boolean("email_welcome").default(true).notNull(),
  emailCopyComplete: boolean("email_copy_complete").default(true).notNull(),
  emailDailyDigest: boolean("email_daily_digest").default(true).notNull(),
  emailAnnouncements: boolean("email_announcements").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tips cache table
export const tipsCache = pgTable("tips_cache", {
  id: uuid("id").defaultRandom().primaryKey(),
  subject: varchar("subject", { length: 100 }).notNull(),
  topic: varchar("topic", { length: 255 }),
  content: text("content").notNull(), // JSON
  sources: text("sources"), // JSON array
  cachedAt: timestamp("cached_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Bookmarks table
export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  itemType: varchar("item_type", { length: 20 }).notNull(), // 'news' | 'tip'
  itemId: uuid("item_id").notNull(), // References news_articles.id or tips_cache.id
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notes table
export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  sourceType: varchar("source_type", { length: 20 }), // 'chat' | 'news' | 'tip' | 'manual'
  sourceId: uuid("source_id"), // Reference to original content
  tags: text("tags"), // JSON array
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Mock tests table
export const mockTests = pgTable("mock_tests", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // in minutes
  totalQuestions: integer("total_questions").notNull(),
  syllabus: text("syllabus"), // JSON array
  questions: text("questions").notNull(), // JSON array
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Mock test attempts table
export const mockTestAttempts = pgTable("mock_test_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  testId: uuid("test_id")
    .notNull()
    .references(() => mockTests.id, { onDelete: "cascade" }),
  answers: text("answers").notNull(), // JSON
  score: integer("score"),
  evaluationResult: text("evaluation_result"), // JSON
  timeSpent: integer("time_spent"), // in seconds
  status: varchar("status", { length: 20 }).notNull(), // 'in_progress' | 'completed'
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Answer templates table
export const answerTemplates = pgTable("answer_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionType: varchar("question_type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  structure: text("structure").notNull(),
  sampleAnswer: text("sample_answer").notNull(),
  annotations: text("annotations"), // JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Revision schedule table
export const revisionSchedule = pgTable("revision_schedule", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  topic: varchar("topic", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 100 }).notNull(),
  lastRevisedAt: timestamp("last_revised_at").notNull(),
  nextRevisionAt: timestamp("next_revision_at").notNull(),
  revisionCount: integer("revision_count").default(0),
  difficulty: varchar("difficulty", { length: 20 }), // 'easy' | 'medium' | 'hard'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Flashcards table
export const flashcards = pgTable("flashcards", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sourceType: varchar("source_type", { length: 20 }), // 'news' | 'manual'
  sourceId: uuid("source_id"),
  lastReviewedAt: timestamp("last_reviewed_at"),
  nextReviewAt: timestamp("next_review_at"),
  easeFactor: integer("ease_factor").default(250), // For spaced repetition
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Daily quizzes table
export const dailyQuizzes = pgTable("daily_quizzes", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: timestamp("date").notNull().unique(),
  questions: text("questions").notNull(), // JSON array
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Quiz attempts table
export const quizAttempts = pgTable("quiz_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  quizId: uuid("quiz_id")
    .notNull()
    .references(() => dailyQuizzes.id, { onDelete: "cascade" }),
  answers: text("answers").notNull(), // JSON
  score: integer("score").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // 'evaluation_complete' | 'quiz_ready' | 'revision_due' | 'streak_milestone' | 'announcement'
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  link: text("link"), // Link to relevant page
  metadata: text("metadata"), // JSON for additional data
  read: boolean("read").default(false).notNull(),
  relatedId: uuid("related_id"), // Reference to related entity (deprecated, use metadata)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User activities table
export const userActivities = pgTable("user_activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  activityType: varchar("activity_type", { length: 50 }).notNull(), // 'chat_message' | 'copy_upload' | 'news_read' | 'quiz_taken' | 'test_completed'
  activityData: text("activity_data"), // JSON for additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Email logs table
export const emailLogs = pgTable("email_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .references(() => users.id, { onDelete: "cascade" }),
  emailType: varchar("email_type", { length: 50 }).notNull(), // 'welcome' | 'copy_complete' | 'daily_digest' | 'announcement'
  recipient: varchar("recipient", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(), // 'sent' | 'failed' | 'pending'
  resendId: varchar("resend_id", { length: 255 }), // Resend email ID
  errorMessage: text("error_message"),
  metadata: text("metadata"), // JSON for additional data (e.g., copy_id, quiz_id)
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

// Announcements table (for admin-created announcements)
export const announcements = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  targetAudience: varchar("target_audience", { length: 50 }).notNull(), // 'all' | 'active' | 'inactive'
  status: varchar("status", { length: 20 }).notNull(), // 'draft' | 'scheduled' | 'sent'
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  createdBy: varchar("created_by", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// TypeScript type inference from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;

export type CopyEvaluation = typeof copyEvaluations.$inferSelect;
export type NewCopyEvaluation = typeof copyEvaluations.$inferInsert;

export type NewsArticle = typeof newsArticles.$inferSelect;
export type NewNewsArticle = typeof newsArticles.$inferInsert;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;

export type TipsCache = typeof tipsCache.$inferSelect;
export type NewTipsCache = typeof tipsCache.$inferInsert;

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export type MockTest = typeof mockTests.$inferSelect;
export type NewMockTest = typeof mockTests.$inferInsert;

export type MockTestAttempt = typeof mockTestAttempts.$inferSelect;
export type NewMockTestAttempt = typeof mockTestAttempts.$inferInsert;

export type AnswerTemplate = typeof answerTemplates.$inferSelect;
export type NewAnswerTemplate = typeof answerTemplates.$inferInsert;

export type RevisionSchedule = typeof revisionSchedule.$inferSelect;
export type NewRevisionSchedule = typeof revisionSchedule.$inferInsert;

export type Flashcard = typeof flashcards.$inferSelect;
export type NewFlashcard = typeof flashcards.$inferInsert;

export type DailyQuiz = typeof dailyQuizzes.$inferSelect;
export type NewDailyQuiz = typeof dailyQuizzes.$inferInsert;

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type NewQuizAttempt = typeof quizAttempts.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type UserActivity = typeof userActivities.$inferSelect;
export type NewUserActivity = typeof userActivities.$inferInsert;

export type EmailLog = typeof emailLogs.$inferSelect;
export type NewEmailLog = typeof emailLogs.$inferInsert;

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
