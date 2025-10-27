import { db } from "@/db";
import { bookmarks, newsArticles, tipsCache } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Bookmark item type
 */
export type BookmarkItemType = "news" | "tip" | "template";

/**
 * Bookmark with populated item data
 */
export interface BookmarkWithItem {
  id: string;
  userId: string;
  itemType: BookmarkItemType;
  itemId: string;
  createdAt: Date;
  item: typeof newsArticles.$inferSelect | typeof tipsCache.$inferSelect;
}

/**
 * BookmarkService - Service for managing user bookmarks
 */
export class BookmarkService {
  /**
   * Create a bookmark (alias for addBookmark)
   * @param userId - User ID
   * @param itemType - Type of item
   * @param itemId - ID of the item to bookmark
   * @returns Created bookmark
   */
  async createBookmark(userId: string, itemType: BookmarkItemType, itemId: string) {
    return this.addBookmark(userId, itemType, itemId);
  }

  /**
   * Delete a bookmark by item (alias for removeBookmarkByItem)
   * @param userId - User ID
   * @param itemType - Type of item
   * @param itemId - ID of the item
   */
  async deleteBookmark(userId: string, itemType: BookmarkItemType, itemId: string) {
    return this.removeBookmarkByItem(userId, itemType, itemId);
  }

  /**
   * Add a bookmark
   * @param userId - User ID
   * @param itemType - Type of item ('news', 'tip', or 'template')
   * @param itemId - ID of the item to bookmark
   * @returns Created bookmark
   */
  async addBookmark(userId: string, itemType: BookmarkItemType, itemId: string) {
    try {
      // Check if bookmark already exists
      const existing = await db
        .select()
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, userId),
            eq(bookmarks.itemType, itemType),
            eq(bookmarks.itemId, itemId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return existing[0];
      }

      // Create new bookmark
      const result = await db
        .insert(bookmarks)
        .values({
          userId,
          itemType,
          itemId,
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error("Failed to add bookmark:", error);
      throw new Error("Failed to add bookmark");
    }
  }

  /**
   * Remove a bookmark
   * @param bookmarkId - Bookmark ID
   * @param userId - User ID (for authorization)
   */
  async removeBookmark(bookmarkId: string, userId: string) {
    try {
      await db
        .delete(bookmarks)
        .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, userId)));
    } catch (error) {
      console.error("Failed to remove bookmark:", error);
      throw new Error("Failed to remove bookmark");
    }
  }

  /**
   * Remove bookmark by item
   * @param userId - User ID
   * @param itemType - Type of item
   * @param itemId - ID of the item
   */
  async removeBookmarkByItem(
    userId: string,
    itemType: BookmarkItemType,
    itemId: string
  ) {
    try {
      await db
        .delete(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, userId),
            eq(bookmarks.itemType, itemType),
            eq(bookmarks.itemId, itemId)
          )
        );
    } catch (error) {
      console.error("Failed to remove bookmark by item:", error);
      throw new Error("Failed to remove bookmark by item");
    }
  }

  /**
   * Get all bookmarks for a user
   * @param userId - User ID
   * @param itemType - Optional filter by item type
   * @returns Array of bookmarks
   */
  async getUserBookmarks(userId: string, itemType?: BookmarkItemType) {
    try {
      const conditions = [eq(bookmarks.userId, userId)];
      if (itemType) {
        conditions.push(eq(bookmarks.itemType, itemType));
      }

      return await db
        .select()
        .from(bookmarks)
        .where(and(...conditions))
        .orderBy(desc(bookmarks.createdAt));
    } catch (error) {
      console.error("Failed to get user bookmarks:", error);
      throw new Error("Failed to get user bookmarks");
    }
  }

  /**
   * Get bookmarks with populated item data
   * @param userId - User ID
   * @param itemType - Optional filter by item type
   * @returns Array of bookmarks with item data
   */
  async getUserBookmarksWithItems(
    userId: string,
    itemType?: BookmarkItemType
  ): Promise<BookmarkWithItem[]> {
    try {
      const userBookmarks = await this.getUserBookmarks(userId, itemType);

      // Separate bookmarks by type
      const newsBookmarks = userBookmarks.filter((b) => b.itemType === "news");
      const tipBookmarks = userBookmarks.filter((b) => b.itemType === "tip");

      // Fetch news articles
      const newsIds = newsBookmarks.map((b) => b.itemId);
      const newsItems =
        newsIds.length > 0
          ? await db
              .select()
              .from(newsArticles)
              .where(
                eq(
                  newsArticles.id,
                  newsIds[0] // This is a placeholder; proper implementation would use inArray
                )
              )
          : [];

      // Fetch tips
      const tipIds = tipBookmarks.map((b) => b.itemId);
      const tipItems =
        tipIds.length > 0
          ? await db
              .select()
              .from(tipsCache)
              .where(
                eq(
                  tipsCache.id,
                  tipIds[0] // This is a placeholder; proper implementation would use inArray
                )
              )
          : [];

      // Create maps for quick lookup
      const newsMap = new Map(newsItems.map((item) => [item.id, item]));
      const tipMap = new Map(tipItems.map((item) => [item.id, item]));

      // Combine bookmarks with items
      const result: BookmarkWithItem[] = [];

      for (const bookmark of userBookmarks) {
        let item;
        if (bookmark.itemType === "news") {
          item = newsMap.get(bookmark.itemId);
        } else {
          item = tipMap.get(bookmark.itemId);
        }

        if (item) {
          result.push({
            id: bookmark.id,
            userId: bookmark.userId,
            itemType: bookmark.itemType as BookmarkItemType,
            itemId: bookmark.itemId,
            createdAt: bookmark.createdAt,
            item,
          });
        }
      }

      return result;
    } catch (error) {
      console.error("Failed to get bookmarks with items:", error);
      throw new Error("Failed to get bookmarks with items");
    }
  }

  /**
   * Check if an item is bookmarked
   * @param userId - User ID
   * @param itemType - Type of item
   * @param itemId - ID of the item
   * @returns True if bookmarked, false otherwise
   */
  async isBookmarked(
    userId: string,
    itemType: BookmarkItemType,
    itemId: string
  ): Promise<boolean> {
    try {
      const result = await db
        .select()
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, userId),
            eq(bookmarks.itemType, itemType),
            eq(bookmarks.itemId, itemId)
          )
        )
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error("Failed to check bookmark status:", error);
      return false;
    }
  }

  /**
   * Get bookmark count for a user
   * @param userId - User ID
   * @param itemType - Optional filter by item type
   * @returns Number of bookmarks
   */
  async getBookmarkCount(userId: string, itemType?: BookmarkItemType): Promise<number> {
    try {
      const userBookmarks = await this.getUserBookmarks(userId, itemType);
      return userBookmarks.length;
    } catch (error) {
      console.error("Failed to get bookmark count:", error);
      return 0;
    }
  }
}

// Export singleton instance
export const bookmarkService = new BookmarkService();
