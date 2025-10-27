"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ExternalLink, Newspaper, BookmarkX, Bookmark as BookmarkIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface NewsArticle {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  source: string;
  category: string;
  imageUrl: string | null;
  publishedAt: Date;
  externalUrl: string | null;
}

interface BookmarkedNews {
  id: string;
  itemId: string;
  createdAt: Date;
  item: NewsArticle;
}

interface BookmarkedNewsListProps {
  userId: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  national: "National",
  international: "International",
  economy: "Economy",
  "science-tech": "Science & Tech",
  environment: "Environment",
  polity: "Polity",
  defense: "Defense",
  culture: "Culture",
};

const CATEGORY_COLORS: Record<string, string> = {
  national: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  international: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  economy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "science-tech": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  environment: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  polity: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  defense: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  culture: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};

export function BookmarkedNewsList({ userId }: BookmarkedNewsListProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkedNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookmarks();
  }, [userId]);

  const fetchBookmarks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/bookmarks?type=news");

      if (!response.ok) {
        throw new Error("Failed to fetch bookmarks");
      }

      const data = await response.json();

      // Convert date strings to Date objects
      const bookmarksWithDates = data.bookmarks.map((bookmark: any) => ({
        ...bookmark,
        createdAt: new Date(bookmark.createdAt),
        item: {
          ...bookmark.item,
          publishedAt: new Date(bookmark.item.publishedAt),
        },
      }));

      setBookmarks(bookmarksWithDates);
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
      setError("Failed to load bookmarked news. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBookmark = async (bookmarkId: string, articleTitle: string) => {
    try {
      const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove bookmark");
      }

      // Remove from local state
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));

      toast({
        title: "Bookmark removed",
        description: `"${articleTitle}" removed from bookmarks`,
      });
    } catch (err) {
      console.error("Error removing bookmark:", err);
      toast({
        title: "Error",
        description: "Failed to remove bookmark. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchBookmarks}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <BookmarkIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No bookmarked news articles yet.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Bookmark articles from the Current Affairs section to save them here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookmarks.map((bookmark) => (
        <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="secondary"
                    className={CATEGORY_COLORS[bookmark.item.category] || ""}
                  >
                    {CATEGORY_LABELS[bookmark.item.category] || bookmark.item.category}
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(bookmark.item.publishedAt, "MMM dd, yyyy")}
                  </div>
                </div>
                <CardTitle className="text-xl leading-tight">
                  {bookmark.item.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Newspaper className="h-3 w-3" />
                  {bookmark.item.source}
                </CardDescription>
              </div>
              {bookmark.item.imageUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={bookmark.item.imageUrl}
                    alt={bookmark.item.title}
                    className="w-24 h-24 object-cover rounded-md"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {bookmark.item.summary || bookmark.item.content}
            </p>
            <div className="flex items-center justify-between">
              <div>
                {bookmark.item.externalUrl && (
                  <a
                    href={bookmark.item.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-primary hover:underline"
                  >
                    Read full article
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveBookmark(bookmark.id, bookmark.item.title)}
                className="text-muted-foreground hover:text-destructive"
              >
                <BookmarkX className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
