"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Lightbulb,
  Target,
  BookOpen,
  Clock,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CustomTipRequest } from "@/components/custom-tip-request";
import { useTextSelection } from "@/hooks/use-text-selection";
import { SendToNotesButton } from "@/components/send-to-notes-button";
import { SendToNotesDialog } from "@/components/send-to-notes-dialog";

interface Tip {
  title: string;
  description: string;
  category: "preparation" | "exam-strategy" | "resources" | "time-management";
  priority: "high" | "medium" | "low";
}

interface TipBookmarkState {
  [key: string]: boolean; // key is tip title
}

interface TipsDisplayProps {
  subject: string;
  onBack: () => void;
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
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
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

export function TipsDisplay({ subject, onBack }: TipsDisplayProps) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipsCacheId, setTipsCacheId] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [tipBookmarks, setTipBookmarks] = useState<TipBookmarkState>({});
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [selectedTipId, setSelectedTipId] = useState<string | null>(null);
  const textSelection = useTextSelection();
  const { toast } = useToast();

  useEffect(() => {
    fetchTips();
    checkBookmarkStatus();
  }, [subject]);

  const fetchTips = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/tips?subject=${encodeURIComponent(subject)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch tips");
      }

      const data = await response.json();
      setTips(data.tips || []);
      setSources(data.sources || []);
      setTipsCacheId(data.cacheId || null);
    } catch (error) {
      console.error("Error fetching tips:", error);
      toast({
        title: "Error",
        description: "Failed to load tips. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkBookmarkStatus = async () => {
    try {
      const response = await fetch("/api/bookmarks?type=tip");
      if (response.ok) {
        const data = await response.json();

        // Check individual tip bookmarks and "Bookmark All"
        const tipBookmarkState: TipBookmarkState = {};
        let foundBookmarkAll = false;

        data.bookmarks.forEach((b: any) => {
          if (b.item.subject === subject) {
            try {
              const content = JSON.parse(b.item.content || "[]");

              // If content has exactly 1 tip, it's an individual bookmark
              if (content.length === 1 && content[0].title) {
                tipBookmarkState[content[0].title] = true;
              }
              // If content has multiple tips, it's a "Bookmark All"
              else if (content.length > 1) {
                foundBookmarkAll = true;
              }
            } catch {
              // If parsing fails, might be old format
              if (b.itemId === tipsCacheId) {
                foundBookmarkAll = true;
              }
            }
          }
        });

        setIsBookmarked(foundBookmarkAll);
        setTipBookmarks(tipBookmarkState);
      }
    } catch (err) {
      console.error("Error checking bookmark status:", err);
    }
  };

  const handleIndividualTipBookmark = async (tip: Tip) => {
    const tipKey = tip.title;
    const isCurrentlyBookmarked = tipBookmarks[tipKey];

    try {
      if (isCurrentlyBookmarked) {
        // Find and remove bookmark
        const response = await fetch("/api/bookmarks?type=tip");
        if (response.ok) {
          const data = await response.json();
          // Find bookmark by checking if the cache entry contains this specific tip
          const bookmark = data.bookmarks.find((b: any) => {
            try {
              const content = JSON.parse(b.item.content || "[]");
              return (
                content.length === 1 &&
                content[0].title === tip.title &&
                b.item.subject === subject
              );
            } catch {
              return false;
            }
          });

          if (bookmark) {
            await fetch(`/api/bookmarks/${bookmark.id}`, { method: "DELETE" });
            setTipBookmarks((prev) => {
              const newState = { ...prev };
              delete newState[tipKey];
              return newState;
            });
            toast({
              title: "Bookmark removed",
              description: `"${tip.title}" removed from bookmarks`,
            });
          }
        }
      } else {
        // Add bookmark with individual tip data using the new endpoint
        const response = await fetch("/api/bookmarks/tip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject,
            title: tip.title,
            description: tip.description,
            category: tip.category,
            priority: tip.priority,
          }),
        });

        if (response.ok) {
          setTipBookmarks((prev) => ({ ...prev, [tipKey]: true }));
          toast({
            title: "Bookmarked",
            description: `"${tip.title}" added to bookmarks`,
          });
        } else {
          throw new Error("Failed to create bookmark");
        }
      }
    } catch (err) {
      console.error("Error toggling individual tip bookmark:", err);
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBookmark = async () => {
    if (!tipsCacheId) {
      toast({
        title: "Error",
        description: "Cannot bookmark tips at this time. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isBookmarked) {
        // Find and remove bookmark
        const response = await fetch("/api/bookmarks?type=tip");
        if (response.ok) {
          const data = await response.json();
          const bookmark = data.bookmarks.find(
            (b: any) => b.item.subject === subject
          );
          if (bookmark) {
            await fetch(`/api/bookmarks/${bookmark.id}`, { method: "DELETE" });
            setIsBookmarked(false);
            toast({
              title: "Bookmark removed",
              description: `${subject} tips removed from bookmarks`,
            });
          }
        }
      } else {
        // Add bookmark
        const response = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemType: "tip", itemId: tipsCacheId }),
        });

        if (response.ok) {
          setIsBookmarked(true);
          toast({
            title: "Bookmarked",
            description: `${subject} tips added to bookmarks`,
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

  const groupedTips = tips.reduce((acc, tip) => {
    if (!acc[tip.category]) {
      acc[tip.category] = [];
    }
    acc[tip.category].push(tip);
    return acc;
  }, {} as Record<string, Tip[]>);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-purple-600" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold capitalize">
            Loading {subject} Tips
          </h3>
          <p className="text-muted-foreground">
            Fetching expert tips and strategies from our knowledge base...
          </p>
        </div>
      </div>
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
            // Try to find which tip the selection is from
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const container = range.commonAncestorContainer;
              const tipElement = (container as Element).closest?.('[data-tip-id]') || 
                                (container.parentElement as Element)?.closest?.('[data-tip-id]');
              if (tipElement) {
                setSelectedTipId(tipElement.getAttribute('data-tip-id'));
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
        sourceType="tip"
        sourceId={selectedTipId || tipsCacheId || undefined}
      />

      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold capitalize break-words">
              {subject} - Tips & Tricks
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Expert preparation strategies and resources
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="lg"
          onClick={handleBookmark}
          className="flex items-center gap-2 shrink-0 w-full sm:w-auto"
        >
          {isBookmarked ? (
            <>
              <BookmarkCheck className="h-5 w-5 fill-current" />
              Bookmarked
            </>
          ) : (
            <>
              <Bookmark className="h-5 w-5" />
              Bookmark All
            </>
          )}
        </Button>
      </div>

      {/* Custom Tip Request Section - Moved to Top */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h2 className="text-xl sm:text-2xl font-semibold">
            Ask a Custom Question
          </h2>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base">
          Have a specific question about {subject}? Ask our AI for personalized
          tips and guidance.
        </p>
        <CustomTipRequest subject={subject} />
      </div>

      {/* Visual separator between custom and standard tips */}
      <div className="py-6">
        <Separator />
      </div>

      {Object.entries(groupedTips).map(([category, categoryTips]) => {
        const config = categoryConfig[category as keyof typeof categoryConfig];

        return (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-2">
              {config.icon}
              <h2 className="text-xl sm:text-2xl font-semibold">
                {config.label}
              </h2>
            </div>

            <div className="grid gap-4">
              {categoryTips.map((tip, index) => {
                const isTipBookmarked = tipBookmarks[tip.title] || false;
                return (
                  <Card
                    key={index}
                    className="hover:shadow-md transition-shadow overflow-hidden"
                    data-tip-id={`${category}-${index}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className={config.color}>
                              {config.label}
                            </Badge>
                            <div
                              className={`h-2 w-2 rounded-full shrink-0 ${
                                priorityConfig[tip.priority].color
                              }`}
                            />
                          </div>
                          <CardTitle className="text-lg sm:text-xl break-words">
                            {tip.title}
                          </CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleIndividualTipBookmark(tip)}
                          className="shrink-0"
                          title={
                            isTipBookmarked
                              ? "Remove bookmark"
                              : "Bookmark this tip"
                          }
                        >
                          {isTipBookmarked ? (
                            <BookmarkCheck className="h-5 w-5 fill-current text-purple-600" />
                          ) : (
                            <Bookmark className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm sm:text-base whitespace-pre-line break-words">
                        {tip.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {sources.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <ExternalLink className="h-5 w-5 shrink-0" />
              Sources & References
            </CardTitle>
            <CardDescription className="text-sm">
              Information sourced from reliable UPSC preparation resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {sources.map((source, index) => {
                // Check if source contains a URL
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const urls = source.match(urlRegex);

                if (urls && urls.length > 0) {
                  // Extract URL and text
                  const parts = source.split(urlRegex);

                  return (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground break-words flex items-start gap-2"
                    >
                      <span className="shrink-0">•</span>
                      <span className="flex-1">
                        {parts.map((part, i) => {
                          const isUrl = urls.some((url) => url === part);
                          if (isUrl) {
                            return (
                              <a
                                key={i}
                                href={part}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline inline-flex items-center gap-1"
                              >
                                {part}
                                <ExternalLink className="h-3 w-3 inline" />
                              </a>
                            );
                          }
                          return part ? <span key={i}>{part}</span> : null;
                        })}
                      </span>
                    </li>
                  );
                } else {
                  // No URL, just display as text
                  return (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground break-words"
                    >
                      • {source}
                    </li>
                  );
                }
              })}
            </ul>
          </CardContent>
        </Card>
      )}
      </div>
    </>
  );
}
