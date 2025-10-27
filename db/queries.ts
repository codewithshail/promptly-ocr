import { db } from "./index";
import { users, userPreferences, type NewUser, type NewUserPreferences } from "./schema";
import { eq } from "drizzle-orm";

/**
 * Database query functions for the UPSC Aspirant Platform
 * 
 * This file contains reusable query functions for database operations.
 * Additional query functions for new tables (chat_messages, copy_evaluations, 
 * news_articles, etc.) will be added as features are implemented.
 */

// Default news categories for new users
const DEFAULT_NEWS_CATEGORIES = [
  'national',
  'international',
  'economy',
  'polity',
  'science-tech',
  'environment'
];

// User operations
export async function createUser(userData: NewUser) {
  const [user] = await db.insert(users).values(userData).returning();
  return user;
}

export async function getUserById(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user;
}

export async function upsertUser(userData: NewUser) {
  const existingUser = await getUserById(userData.id);
  
  if (existingUser) {
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, userData.id))
      .returning();
    return updatedUser;
  }
  
  return createUser(userData);
}

// User preferences operations
export async function getUserPreferences(userId: string) {
  const [preferences] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId));
  return preferences;
}

export async function createDefaultUserPreferences(userId: string) {
  const defaultPreferences: NewUserPreferences = {
    userId,
    newsCategories: JSON.stringify(DEFAULT_NEWS_CATEGORIES),
    thinkingModeDefault: false,
    notificationSettings: JSON.stringify({
      evaluationComplete: true,
      quizReady: true,
      revisionDue: true,
      streakMilestone: true,
    }),
    dailyStreak: 0,
    lastActivityDate: null,
  };

  const [preferences] = await db
    .insert(userPreferences)
    .values(defaultPreferences)
    .returning();
  
  return preferences;
}

export async function getOrCreateUserPreferences(userId: string) {
  let preferences = await getUserPreferences(userId);
  
  if (!preferences) {
    preferences = await createDefaultUserPreferences(userId);
  }
  
  return preferences;
}

export async function updateUserPreferences(
  userId: string,
  updates: Partial<Omit<NewUserPreferences, 'userId'>>
) {
  const [updatedPreferences] = await db
    .update(userPreferences)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(userPreferences.userId, userId))
    .returning();
  
  return updatedPreferences;
}
