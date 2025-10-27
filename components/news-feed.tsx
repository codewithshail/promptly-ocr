"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ExternalLink, Newspaper, Bookmark, BookmarkCheck } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useTextSelection } from "@/hooks/use-text-selection";
import { SendToNotesButton } from "@/components/send-to-notes-button";
import { SendToNotesDialog } from "@/components/send-to-notes-dialog";
import { useActivityTracker } from "@/hooks/use-activity-tracker";

export interface NewsArticle {
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

interface NewsFeedProps {
  userId: string;
  onArticleClick?: (article: NewsArticle) => void;
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

export function NewsFeed({ userId, onArticleClick }: NewsFeedProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<string>>(new Set());
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const textSelection = useTextSelection();
  const { toast } = useToast();
  const { trackActivity } = useActivityTracker();

  useEffect(() => {
    fetchArticles();
    fetchBookmarks();
  }, [userId]);

  const fetchArticles = async (pageNum: number = 1) => {
    try {
      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      const response = await fetch(`/api/news?page=${pageNum}&limit=20`);

      if (!response.ok) {
        throw new Error("Failed to fetch news articles");
      }

      const data = await response.json();

      // Convert date strings to Date objects
      const articlesWithDates = data.articles.map((article: any) => ({
        ...article,
        publishedAt: new Date(article.publishedAt),
      }));

      if (pageNum === 1) {
        setArticles(articlesWithDates);
      } else {
        setArticles((prev) => [...prev, ...articlesWithDates]);
      }

      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError("Failed to load news articles. Please try again later.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const response = await fetch("/api/bookmarks?type=news");
      if (response.ok) {
        const data = await response.json();
        const bookmarkedIds = new Set<string>(data.bookmarks.map((b: any) => b.itemId as string));
        setBookmarkedArticles(bookmarkedIds);
      }
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
    }
  };

  const handleBookmark = async (articleId: string, articleTitle: string) => {
    const isBookmarked = bookmarkedArticles.has(articleId);

    try {
      if (isBookmarked) {
        // Find the bookmark ID and remove it
        const response = await fetch("/api/bookmarks?type=news");
        if (response.ok) {
          const data = await response.json();
          const bookmark = data.bookmarks.find((b: any) => b.itemId === articleId);
          if (bookmark) {
            await fetch(`/api/bookmarks/${bookmark.id}`, { method: "DELETE" });
            setBookmarkedArticles((prev) => {
              const newSet = new Set(prev);
              newSet.delete(articleId);
              return newSet;
            });
            toast({
              title: "Bookmark removed",
              description: `"${articleTitle}" removed from bookmarks`,
            });
          }
        }
      } else {
        // Add bookmark
        const response = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemType: "news", itemId: articleId }),
        });

        if (response.ok) {
          setBookmarkedArticles((prev) => new Set(prev).add(articleId));
          toast({
            title: "Bookmarked",
            description: `"${articleTitle}" added to bookmarks`,
          });
        }
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchArticles(page + 1);
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
            <Button onClick={() => fetchArticles(1)}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (articles.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No news articles available at the moment.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Check back later for updates.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Send to Notes Button */}
      {textSelection && (
        <SendToNotesButton
          x={textSelection.x}
          y={textSelection.y}
          onClick={() => {
            setShowNotesDialog(true);
            // Try to find which article the selection is from
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const container = range.commonAncestorContainer;
              const articleElement = (container as Element).closest?.('[data-article-id]') || 
                                    (container.parentElement as Element)?.closest?.('[data-article-id]');
              if (articleElement) {
                setSelectedArticleId(articleElement.getAttribute('data-article-id'));
              }
            }
          }}
        />
      )}

      {/* Send to Notes Dialog */}
      <SendToNotesDialog
        open={showNotesDialog}
        onOpenChange={setShowNotesDialog}
        selectedText={textSelection?.text || ""}
        sourceType="news"
        sourceId={selectedArticleId || undefined}
      />

      <div className="space-y-4">
        {articles.map((article) => (
          <NewsCard
            key={article.id}
            article={article}
            isBookmarked={bookmarkedArticles.has(article.id)}
            onBookmark={() => handleBookmark(article.id, article.title)}
            onClick={() => {
              // Track news read activity
              trackActivity("news_read", {
                articleId: article.id,
                category: article.category,
              });
              onArticleClick?.(article);
            }}
          />
        ))}

        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button
              onClick={loadMore}
              disabled={isLoadingMore}
              variant="outline"
            >
              {isLoadingMore ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

interface NewsCardProps {
  article: NewsArticle;
  isBookmarked: boolean;
  onBookmark: () => void;
  onClick?: () => void;
}

function NewsCard({ article, isBookmarked, onBookmark, onClick }: NewsCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow" data-article-id={article.id}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2 cursor-pointer" onClick={onClick}>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="secondary"
                className={CATEGORY_COLORS[article.category] || ""}
              >
                {CATEGORY_LABELS[article.category] || article.category}
              </Badge>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                {format(article.publishedAt, "MMM dd, yyyy")}
              </div>
            </div>
            <CardTitle className="text-xl leading-tight hover:text-primary transition-colors">
              {article.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Newspaper className="h-3 w-3" />
              {article.source}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onBookmark();
              }}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-5 w-5 fill-current" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </Button>
            {article.imageUrl && (
              <div className="flex-shrink-0">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-24 h-24 object-cover rounded-md"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {article.summary || article.content}
        </p>
        {article.externalUrl && (
          <div className="mt-4">
            <a
              href={article.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Read full article
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
