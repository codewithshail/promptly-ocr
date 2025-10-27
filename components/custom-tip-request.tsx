"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark, BookmarkCheck, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomTipRequestProps {
  subject: string;
}

interface CustomTip {
  question: string;
  answer: string;
  subject: string;
  timestamp: string;
  cacheId: string;
}

export function CustomTipRequest({ subject }: CustomTipRequestProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [customTip, setCustomTip] = useState<CustomTip | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { toast } = useToast();

  const MAX_CHARS = 500;
  const remainingChars = MAX_CHARS - question.length;

  // Reset state when subject changes
  useEffect(() => {
    setQuestion("");
    setCustomTip(null);
    setIsBookmarked(false);
  }, [subject]);

  const handleClear = () => {
    setQuestion("");
    setCustomTip(null);
    setIsBookmarked(false);
  };

  const checkBookmarkStatus = async (cacheId: string) => {
    try {
      const response = await fetch("/api/bookmarks?type=tip");
      if (response.ok) {
        const data = await response.json();
        const hasBookmark = data.bookmarks.some(
          (b: any) => b.itemId === cacheId
        );
        setIsBookmarked(hasBookmark);
      }
    } catch (err) {
      console.error("Error checking bookmark status:", err);
    }
  };

  const handleBookmark = async () => {
    if (!customTip) return;

    try {
      if (isBookmarked) {
        // Find and remove bookmark
        const response = await fetch("/api/bookmarks?type=tip");
        if (response.ok) {
          const data = await response.json();
          const bookmark = data.bookmarks.find(
            (b: any) => b.itemId === customTip.cacheId
          );
          if (bookmark) {
            await fetch(`/api/bookmarks/${bookmark.id}`, { method: "DELETE" });
            setIsBookmarked(false);
            toast({
              title: "Bookmark removed",
              description: "Custom tip removed from bookmarks",
            });
          }
        }
      } else {
        // Add bookmark
        const response = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemType: "tip",
            itemId: customTip.cacheId,
          }),
        });

        if (response.ok) {
          setIsBookmarked(true);
          toast({
            title: "Bookmarked",
            description: "Custom tip added to bookmarks",
          });
        } else {
          throw new Error("Failed to bookmark");
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

  const handleGenerateTip = async () => {
    if (!question.trim()) return;

    try {
      setLoading(true);
      const response = await fetch("/api/tips/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          question: question.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate tip");
      }

      const data = await response.json();
      setCustomTip(data.tip);
      
      // Check if this tip is already bookmarked
      await checkBookmarkStatus(data.tip.cacheId);
      
      toast({
        title: "Custom tip generated",
        description: data.cached
          ? "Retrieved from cache"
          : "Generated fresh for you",
      });
    } catch (error) {
      console.error("Error generating custom tip:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate custom tip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-full">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Your Question</CardTitle>
          <CardDescription className="text-sm break-words">
            Ask anything about {subject} preparation, strategies, or resources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder={`Ask for custom tips about ${subject}...`}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
              className="min-h-[120px] resize-none w-full"
              maxLength={MAX_CHARS}
            />
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span
                className={`text-muted-foreground ${
                  remainingChars < 50 ? "text-amber-500" : ""
                } ${remainingChars === 0 ? "text-red-500" : ""}`}
              >
                {remainingChars} characters remaining
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGenerateTip}
              disabled={loading || question.trim().length === 0}
              className="flex-1"
            >
              {loading ? "Generating..." : "Generate Tip"}
            </Button>
            {(question || customTip) && (
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={loading}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading skeleton */}
      {loading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      )}

      {/* Display generated custom tip */}
      {customTip && !loading && (
        <Card className="border-purple-200 dark:border-purple-800 hover:shadow-md transition-shadow overflow-hidden">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 shrink-0">
                    Custom Tip
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(customTip.timestamp).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                </div>
                <CardTitle className="text-lg sm:text-xl break-words">{customTip.question}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBookmark}
                className="shrink-0"
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-5 w-5 fill-current" />
                ) : (
                  <Bookmark className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm sm:text-base whitespace-pre-line break-words">
              {customTip.answer}
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
