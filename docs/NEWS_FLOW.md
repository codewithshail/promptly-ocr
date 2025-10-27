# News Feed Flow - Complete Explanation

## Overview

The news system has two main parts:
1. **Background News Fetching** (Inngest) - Runs automatically
2. **Personalized News Display** (User-facing) - Shows when user clicks "Current Affairs"

---

## 🔄 Background News Fetching (Automatic)

### When Does It Run?
- **Automatically every 8 hours**: 00:00, 08:00, 16:00
- **Manually**: Can be triggered via Inngest event `news/fetch.manual`

### What Does It Do?
```
┌─────────────────────────────────────────────────────────────┐
│  Inngest Cron Job (Every 8 hours)                          │
│  inngest/functions/fetch-news.ts                           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Fetch from NewsData.io API                                 │
│  - Fetches ALL categories (not user-specific)              │
│  - Categories: politics, business, tech, environment, etc.  │
│  - Source: Indian news (thehindu.com, indianexpress.com)   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Save to Database (news_articles table)                     │
│  - Deduplicates based on title                             │
│  - Maps API categories to our categories                    │
│  - Stores: title, content, source, category, image, etc.   │
└─────────────────────────────────────────────────────────────┘
```

**Key Point**: Inngest fetches ALL news categories and stores them in the database. It doesn't care about individual user preferences at this stage.

---

## 👤 User News Feed (When User Clicks "Current Affairs")

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. User clicks "Current Affairs" in sidebar               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Page loads: app/(dashboard)/current-affairs/page.tsx   │
│     - Shows category selector                               │
│     - User can see/change their preferences                 │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  3. NewsFeed component loads                                │
│     - Calls: GET /api/news                                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  4. API fetches user preferences                            │
│     - Reads from user_preferences table                     │
│     - Gets newsCategories array (e.g., ["national", ...])  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  5. newsService.getPersonalizedFeed() runs                  │
│                                                              │
│     IF user has preferences:                                │
│     ┌────────────────────────────────────────────────────┐ │
│     │ A. Fetch 70% from PREFERRED categories            │ │
│     │    - Sorted by most recent first                  │ │
│     └────────────────────────────────────────────────────┘ │
│                          │                                   │
│     ┌────────────────────────────────────────────────────┐ │
│     │ B. Fetch 30% from OTHER categories                │ │
│     │    - Excludes already fetched articles            │ │
│     │    - Sorted by most recent first                  │ │
│     └────────────────────────────────────────────────────┘ │
│                          │                                   │
│     IF no preferences:                                      │
│     ┌────────────────────────────────────────────────────┐ │
│     │ Fetch ALL articles (no filtering)                 │ │
│     │ - Sorted by most recent first                     │ │
│     └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Articles displayed to user                              │
│     - Preferred categories appear FIRST                     │
│     - Other categories appear AFTER                         │
│     - User sees ALL news, just prioritized!                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Example Scenario

### User Preferences
User selects: `["national", "economy", "polity"]`

### What User Sees (20 articles requested)

```
┌─────────────────────────────────────────────────────────────┐
│  PREFERRED CATEGORIES (70% = 14 articles)                   │
├─────────────────────────────────────────────────────────────┤
│  1. National: Budget 2024 highlights...                     │
│  2. Economy: GDP growth reaches 7.2%...                     │
│  3. Polity: New bill passed in parliament...                │
│  4. National: State elections announced...                  │
│  5. Economy: RBI monetary policy update...                  │
│  ... (9 more from preferred categories)                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  OTHER CATEGORIES (30% = 6 articles)                        │
├─────────────────────────────────────────────────────────────┤
│  15. Science-Tech: ISRO launches new satellite...           │
│  16. International: G20 summit outcomes...                  │
│  17. Environment: Climate change report...                  │
│  18. Defense: New defense deal signed...                    │
│  19. Science-Tech: AI regulation framework...               │
│  20. Culture: UNESCO heritage site added...                 │
└─────────────────────────────────────────────────────────────┘
```

**Key Insight**: User sees ALL categories, but their preferred ones appear first!

---

## ✅ To Answer Your Question

> "When user chooses preference for news, will Inngest automatically fetch everything, and when user clicks should see all news even preferred ones?"

**Answer**: 

1. ✅ **Inngest fetches EVERYTHING** - It doesn't care about individual user preferences. It fetches all categories every 8 hours and stores them in the database.

2. ✅ **User sees ALL news** - When they click "Current Affairs", they see:
   - Their **preferred categories FIRST** (70% of results)
   - **Other categories AFTER** (30% of results)
   - This way they stay informed about everything, but their interests are prioritized!

3. ✅ **Preferences only affect DISPLAY ORDER** - Not what gets fetched by Inngest.

---

## 🎯 Benefits of This Approach

1. **Efficient**: Inngest fetches once for all users (not per-user)
2. **Comprehensive**: Users see all important news, not just their bubble
3. **Personalized**: Preferred topics appear first for quick access
4. **Flexible**: Users can change preferences anytime without re-fetching

---

## 🔧 Manual News Fetch

If you need to manually trigger news fetching (for testing or immediate updates):

```typescript
// Trigger manual fetch via Inngest
await inngest.send({
  name: "news/fetch.manual"
});
```

This will immediately fetch and update the news database.

---

## 📝 Database Tables Involved

1. **news_articles**: Stores all fetched news
   - Updated by Inngest every 8 hours
   - Contains ALL categories

2. **user_preferences**: Stores user's selected categories
   - Used by API to prioritize news display
   - Does NOT affect what Inngest fetches

---

## 🚀 Future Enhancements

Potential improvements:
- Add "Show only preferred categories" toggle
- Add category-specific page views
- Add news search functionality
- Add bookmarking favorite articles
- Add "Read later" functionality
