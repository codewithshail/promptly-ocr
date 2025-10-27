# Database Documentation

This directory contains all database-related code for the UPSC Aspirant Platform.

## Structure

- `index.ts` - Database connection and configuration
- `schema.ts` - Drizzle ORM schema definitions
- `queries.ts` - Reusable database query functions
- `migrations/` - Database migration files

## Schema Overview

### Tables

1. **users** - User accounts synced with Clerk authentication
   - `id` (varchar, primary key) - Clerk user ID
   - `email` (varchar, unique)
   - `firstName` (varchar)
   - `lastName` (varchar)
   - `imageUrl` (text)
   - `isAdmin` (boolean) - Admin role flag
   - `createdAt` (timestamp)
   - `updatedAt` (timestamp)

2. **chat_messages** - AI chatbot conversation history
   - `id` (uuid, primary key)
   - `userId` (varchar, foreign key to users)
   - `role` (varchar) - 'user' or 'assistant'
   - `content` (text) - Message content
   - `thinkingProcess` (text) - Gemini thinking process (optional)
   - `thinkingModeUsed` (boolean)
   - `createdAt` (timestamp)

3. **copy_evaluations** - GS and Essay copy evaluations
   - `id` (uuid, primary key)
   - `userId` (varchar, foreign key to users)
   - `fileName` (varchar)
   - `fileUrl` (text)
   - `copyType` (varchar) - 'gs' or 'essay'
   - `extractedText` (text)
   - `evaluationResult` (text, JSON)
   - `status` (varchar)
   - `errorMessage` (text)
   - `createdAt` (timestamp)
   - `updatedAt` (timestamp)

4. **news_articles** - Current affairs news articles
   - `id` (uuid, primary key)
   - `title` (varchar)
   - `summary` (text)
   - `content` (text)
   - `source` (varchar)
   - `category` (varchar)
   - `imageUrl` (text)
   - `publishedAt` (timestamp)
   - `fetchedAt` (timestamp)
   - `externalUrl` (text)

5. **user_preferences** - User settings and preferences
   - `id` (uuid, primary key)
   - `userId` (varchar, foreign key to users, unique)
   - `newsCategories` (text, JSON array)
   - `thinkingModeDefault` (boolean)
   - `notificationSettings` (text, JSON)
   - `dailyStreak` (integer)
   - `lastActivityDate` (timestamp)
   - `createdAt` (timestamp)
   - `updatedAt` (timestamp)

6. **tips_cache** - Cached tips and tricks
   - `id` (uuid, primary key)
   - `subject` (varchar)
   - `topic` (varchar)
   - `content` (text, JSON)
   - `sources` (text, JSON array)
   - `cachedAt` (timestamp)
   - `expiresAt` (timestamp)

7. **bookmarks** - User bookmarks for news and tips
   - `id` (uuid, primary key)
   - `userId` (varchar, foreign key to users)
   - `itemType` (varchar) - 'news' or 'tip'
   - `itemId` (uuid)
   - `createdAt` (timestamp)

8. **notes** - User notes with AI assistance
   - `id` (uuid, primary key)
   - `userId` (varchar, foreign key to users)
   - `title` (varchar)
   - `content` (text)
   - `sourceType` (varchar) - 'chat', 'news', 'tip', or 'manual'
   - `sourceId` (uuid)
   - `tags` (text, JSON array)
   - `category` (varchar)
   - `createdAt` (timestamp)
   - `updatedAt` (timestamp)

9. **mock_tests** - Mock test definitions
   - `id` (uuid, primary key)
   - `title` (varchar)
   - `description` (text)
   - `duration` (integer) - in minutes
   - `totalQuestions` (integer)
   - `syllabus` (text, JSON array)
   - `questions` (text, JSON array)
   - `createdAt` (timestamp)

10. **mock_test_attempts** - User mock test attempts
    - `id` (uuid, primary key)
    - `userId` (varchar, foreign key to users)
    - `testId` (uuid, foreign key to mock_tests)
    - `answers` (text, JSON)
    - `score` (integer)
    - `evaluationResult` (text, JSON)
    - `timeSpent` (integer) - in seconds
    - `status` (varchar) - 'in_progress' or 'completed'
    - `startedAt` (timestamp)
    - `completedAt` (timestamp)

11. **answer_templates** - Answer writing templates
    - `id` (uuid, primary key)
    - `questionType` (varchar)
    - `title` (varchar)
    - `structure` (text)
    - `sampleAnswer` (text)
    - `annotations` (text, JSON)
    - `createdAt` (timestamp)

12. **revision_schedule** - Spaced repetition revision schedule
    - `id` (uuid, primary key)
    - `userId` (varchar, foreign key to users)
    - `topic` (varchar)
    - `subject` (varchar)
    - `lastRevisedAt` (timestamp)
    - `nextRevisionAt` (timestamp)
    - `revisionCount` (integer)
    - `difficulty` (varchar) - 'easy', 'medium', or 'hard'
    - `createdAt` (timestamp)

13. **flashcards** - Flashcards for active learning
    - `id` (uuid, primary key)
    - `userId` (varchar, foreign key to users)
    - `question` (text)
    - `answer` (text)
    - `sourceType` (varchar) - 'news' or 'manual'
    - `sourceId` (uuid)
    - `lastReviewedAt` (timestamp)
    - `nextReviewAt` (timestamp)
    - `easeFactor` (integer) - for spaced repetition
    - `reviewCount` (integer)
    - `createdAt` (timestamp)

14. **daily_quizzes** - Daily current affairs quizzes
    - `id` (uuid, primary key)
    - `date` (timestamp, unique)
    - `questions` (text, JSON array)
    - `createdAt` (timestamp)

15. **quiz_attempts** - User quiz attempts
    - `id` (uuid, primary key)
    - `userId` (varchar, foreign key to users)
    - `quizId` (uuid, foreign key to daily_quizzes)
    - `answers` (text, JSON)
    - `score` (integer)
    - `completedAt` (timestamp)

16. **notifications** - System notifications
    - `id` (uuid, primary key)
    - `userId` (varchar, foreign key to users)
    - `type` (varchar) - notification type
    - `title` (varchar)
    - `message` (text)
    - `isRead` (boolean)
    - `relatedId` (uuid) - reference to related entity
    - `createdAt` (timestamp)

17. **user_activities** - User activity tracking
    - `id` (uuid, primary key)
    - `userId` (varchar, foreign key to users)
    - `activityType` (varchar) - activity type
    - `activityData` (text, JSON)
    - `createdAt` (timestamp)

## Database Setup

### Prerequisites

- PostgreSQL database (we use Neon)
- Environment variables configured in `.env`:
  - `DATABASE_URL` - PostgreSQL connection string

### Initial Setup

```bash
# Generate migration files from schema
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Or push schema directly (development only)
npm run db:push

# Open Drizzle Studio to view/edit data
npm run db:studio
```

## Clerk Webhook Integration

The application uses Clerk webhooks to sync user data:
- When a user signs up, the webhook creates a user record
- When a user updates their profile, the webhook updates the user record
- This prevents foreign key errors when creating user-related records

## Available Scripts

- `npm run db:generate` - Generate migration files from schema changes
- `npm run db:migrate` - Run pending migrations
- `npm run db:push` - Push schema directly to database (dev only)
- `npm run db:studio` - Open Drizzle Studio GUI

## Query Functions

### User Operations
- `createUser(userData)` - Create a new user
- `getUserById(userId)` - Get user by ID
- `upsertUser(userData)` - Create or update user
