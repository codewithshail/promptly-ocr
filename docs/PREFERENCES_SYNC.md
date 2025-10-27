# User Preferences Synchronization

This document explains how user preferences are synchronized across the UPSC Aspirant Platform.

## Overview

User preferences are automatically synchronized across all devices and sessions. The system ensures that:

1. Default preferences are created on first login
2. Preferences are loaded when users access any feature
3. Changes to preferences are immediately saved and synced
4. Preferences persist across devices and sessions

## Architecture

### Database Schema

User preferences are stored in the `user_preferences` table with the following fields:

- `userId`: Reference to the user
- `newsCategories`: JSON array of selected news categories
- `thinkingModeDefault`: Boolean for default chatbot thinking mode
- `notificationSettings`: JSON object for notification preferences
- `dailyStreak`: Integer tracking consecutive days of activity
- `lastActivityDate`: Timestamp of last user activity

### Default Preferences

When a user is created (via Clerk webhook), default preferences are automatically initialized:

```typescript
{
  newsCategories: ['national', 'international', 'economy', 'polity', 'science-tech', 'environment'],
  thinkingModeDefault: false,
  notificationSettings: {
    evaluationComplete: true,
    quizReady: true,
    revisionDue: true,
    streakMilestone: true
  },
  dailyStreak: 0,
  lastActivityDate: null
}
```

## API Endpoints

### GET /api/preferences

Fetches user preferences. If preferences don't exist, creates them with defaults.

**Response:**
```json
{
  "newsCategories": ["national", "international", ...],
  "thinkingModeDefault": false,
  "notificationSettings": {...},
  "dailyStreak": 0,
  "lastActivityDate": null
}
```

### POST /api/preferences

Updates user preferences. Accepts partial updates.

**Request Body:**
```json
{
  "newsCategories": ["national", "economy"],
  "thinkingModeDefault": true
}
```

## Client-Side Hook

The `usePreferences` hook provides a consistent way to access and update preferences:

```typescript
import { usePreferences } from "@/hooks/use-preferences";

function MyComponent() {
  const { preferences, isLoading, updatePreferences } = usePreferences();

  // Access preferences
  const categories = preferences?.newsCategories || [];

  // Update preferences
  const handleUpdate = async () => {
    await updatePreferences({ thinkingModeDefault: true });
  };
}
```

## Feature Integration

### Chatbot

The chatbot automatically:
- Loads the user's thinking mode preference on mount
- Applies the preference to all chat interactions
- Saves changes when the user toggles thinking mode

### Current Affairs

The news feed automatically:
- Loads the user's selected news categories
- Filters and prioritizes news based on preferences
- Saves changes when the user updates categories

### Profile Page

The profile page provides a centralized interface to:
- View all current preferences
- Update news categories
- Toggle thinking mode default
- Configure notification settings

## Synchronization Flow

1. **On Login**: Clerk webhook creates user and default preferences
2. **On Page Load**: Components use `usePreferences` hook to load preferences
3. **On Change**: Updates are sent to API and immediately reflected in UI
4. **Cross-Device**: Preferences are stored in database, accessible from any device

## Database Queries

Key query functions in `db/queries.ts`:

- `getOrCreateUserPreferences(userId)`: Gets preferences or creates defaults
- `updateUserPreferences(userId, updates)`: Updates specific preference fields
- `getUserPreferences(userId)`: Fetches existing preferences

## Testing Preferences

To test preference synchronization:

1. Sign in to the application
2. Update preferences in the Profile page
3. Navigate to Chatbot or Current Affairs
4. Verify preferences are applied
5. Sign out and sign in again
6. Verify preferences persist

## Future Enhancements

Planned improvements to the preference system:

- Real-time sync using WebSockets
- Preference versioning and history
- Import/export preferences
- Preference presets for different exam stages
