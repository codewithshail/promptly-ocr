"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, Target, BookOpen, Clock, BookmarkX, Bookmark as BookmarkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Tip {
  title: string;
  description: string;
  category: "preparation" | "exam-strategy" | "resources" | "time-management";
  priority: "high" | "medium" | "low";
}

interface TipsCache {
  id: string;
  subject: string;
  topic: string | null;
  content: string;
  sources: string | null;
  cachedAt: Date;
  expiresAt: Date;
}

interface BookmarkedTip {
  id: string;
  itemId: string;
  createdAt: Date;
  item: TipsCache;
}

interface BookmarkedTipsListProps {
  userId: string;
}

const categoryConfig = {
  preparation: {
    label: "Preparation",
    icon: <Lightbulb className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  "exam-strategy": {
    label: "Exam Strategy",
    icon: <Target className="h-4 w-4" />,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
  resources: {
    label: "Resources",
    icon: <BookOpen className="h-4 w-4" />,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  "time-management": {
    label: "Time Management",
    icon: <Clock className="h-4 w-4" />,
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  },
};

const priorityConfig = {
  high: { label: "High Priority", color: "bg-red-500" },
  medium: { label: "Medium Priority", color: "bg-yellow-500" },
  low: { label: "Low Priority", color: "bg-gray-500" },
};

export function BookmarkedTipsList({ userId }: BookmarkedTipsListProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkedTip[]>([]);
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

      const response = await fetch("/api/bookmarks?type=tip");

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
          cachedAt: new Date(bookmark.item.cachedAt),
          expiresAt: new Date(bookmark.item.expiresAt),
        },
      }));

      setBookmarks(bookmarksWithDates);
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
      setError("Failed to load bookmarked tips. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBookmark = async (bookmarkId: string, subject: string) => {
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
        description: `${subject} tips removed from bookmarks`,
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
              <Skeleton className="h-32 w-full" />
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
              No bookmarked tips yet.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Bookmark tips from the Tips & Tricks section to save them here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookmarks.map((bookmark) => {
        let tips: Tip[] = [];
        try {
          const content = JSON.parse(bookmark.item.content);
          tips = content.tips || [];
        } catch (e) {
          console.error("Failed to parse tips content:", e);
        }

        return (
          <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="capitalize">
                      {bookmark.item.subject}
                    </Badge>
                    {bookmark.item.topic && (
                      <Badge variant="outline" className="text-xs">
                        {bookmark.item.topic}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl capitalize">
                    {bookmark.item.subject} Tips & Tricks
                  </CardTitle>
                  <CardDescription>
                    {tips.length} tips saved
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveBookmark(bookmark.id, bookmark.item.subject)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <BookmarkX className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tips.slice(0, 3).map((tip, index) => {
                  const config = categoryConfig[tip.category as keyof typeof categoryConfig];
                  
                  return (
                    <div key={index} className="border-l-2 border-primary/20 pl-3 py-1">
                      <div className="flex items-center gap-2 mb-1">
                        {config && (
                          <Badge variant="secondary" className={`${config.color} text-xs`}>
                            {config.label}
                          </Badge>
                        )}
                        <div className={`h-1.5 w-1.5 rounded-full ${priorityConfig[tip.priority].color}`} />
                      </div>
                      <p className="font-medium text-sm">{tip.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {tip.description}
                      </p>
                    </div>
                  );
                })}
                {tips.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{tips.length - 3} more tips
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
