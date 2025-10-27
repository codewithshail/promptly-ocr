"use client";

import { useState, useEffect } from "react";
import { RevisionCalendar } from "@/components/revision-calendar";
import { RevisionQuiz } from "@/components/revision-quiz";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, TrendingUp, BookOpen, Loader2, Brain } from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { RevisionSkeleton } from "@/components/skeletons/revision-skeleton";

interface RevisionItem {
  id: string;
  topic: string;
  subject: string;
  lastRevisedAt: Date;
  nextRevisionAt: Date;
  revisionCount: number;
  difficulty: "easy" | "medium" | "hard";
}

interface RevisionStats {
  totalTopics: number;
  dueTopics: number;
  completedTopics: number;
  avgRevisionsPerTopic: number;
  byDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export function RevisionSchedulerClient() {
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [dueRevisions, setDueRevisions] = useState<RevisionItem[]>([]);
  const [stats, setStats] = useState<RevisionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingAsRevised, setMarkingAsRevised] = useState<string | null>(null);
  const [quizRevision, setQuizRevision] = useState<RevisionItem | null>(null);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRevisions();
  }, []);

  const fetchRevisions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/revision");
      if (!response.ok) throw new Error("Failed to fetch revisions");

      const data = await response.json();
      setRevisions(data.revisions || []);
      setDueRevisions(data.dueRevisions || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error("Error fetching revisions:", error);
      toast({
        title: "Error",
        description: "Failed to load revision schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRevised = async (revisionId: string, difficulty: "easy" | "medium" | "hard") => {
    try {
      setMarkingAsRevised(revisionId);
      const response = await fetch("/api/revision", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionId, difficulty }),
      });

      if (!response.ok) throw new Error("Failed to mark as revised");

      toast({
        title: "Success",
        description: "Topic marked as revised. Next revision scheduled!",
      });

      // Refresh data
      await fetchRevisions();
    } catch (error) {
      console.error("Error marking as revised:", error);
      toast({
        title: "Error",
        description: "Failed to mark topic as revised",
        variant: "destructive",
      });
    } finally {
      setMarkingAsRevised(null);
    }
  };

  const startQuiz = (revision: RevisionItem) => {
    setQuizRevision(revision);
    setShowQuizDialog(true);
  };

  const handleQuizComplete = async (difficulty: "easy" | "medium" | "hard") => {
    if (quizRevision) {
      await markAsRevised(quizRevision.id, difficulty);
      setShowQuizDialog(false);
      setQuizRevision(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "hard":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getDifficultyBadgeVariant = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "default";
      case "medium":
        return "secondary";
      case "hard":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading) {
    return <RevisionSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Revision Scheduler</h1>
        <p className="text-muted-foreground">
          Manage your revision schedule with spaced repetition
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Topics</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTopics}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due Now</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dueTopics}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedTopics}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Revisions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgRevisionsPerTopic}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="due" className="space-y-4">
        <TabsList>
          <TabsTrigger value="due">
            Due Now ({dueRevisions.length})
          </TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="all">All Topics ({revisions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="due" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Due Revisions</CardTitle>
              <CardDescription>
                Topics that need revision now
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dueRevisions.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-center">
                  <div className="space-y-2">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-green-500" />
                    <p className="text-sm text-muted-foreground">
                      All caught up! No revisions due right now.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {dueRevisions.map((revision) => (
                    <div
                      key={revision.id}
                      className="flex items-start justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{revision.topic}</h3>
                          <Badge variant="outline">{revision.subject}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Revision #{revision.revisionCount + 1}</span>
                          <span>•</span>
                          <span>
                            Last revised:{" "}
                            {formatDistanceToNow(new Date(revision.lastRevisedAt), {
                              addSuffix: true,
                            })}
                          </span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <div
                              className={`h-2 w-2 rounded-full ${getDifficultyColor(
                                revision.difficulty
                              )}`}
                            />
                            <span className="capitalize">{revision.difficulty}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => startQuiz(revision)}
                          className="mb-2"
                        >
                          <Brain className="h-4 w-4 mr-2" />
                          Take Quiz
                        </Button>
                        <p className="text-xs text-muted-foreground mb-1">
                          Or mark manually:
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsRevised(revision.id, "easy")}
                            disabled={markingAsRevised === revision.id}
                            className="text-green-600 hover:text-green-700"
                          >
                            {markingAsRevised === revision.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Easy"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsRevised(revision.id, "medium")}
                            disabled={markingAsRevised === revision.id}
                            className="text-yellow-600 hover:text-yellow-700"
                          >
                            {markingAsRevised === revision.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Medium"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsRevised(revision.id, "hard")}
                            disabled={markingAsRevised === revision.id}
                            className="text-red-600 hover:text-red-700"
                          >
                            {markingAsRevised === revision.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Hard"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <RevisionCalendar revisions={revisions} />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Topics</CardTitle>
              <CardDescription>
                Complete list of topics in your revision schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              {revisions.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-center">
                  <p className="text-sm text-muted-foreground">
                    No topics in revision schedule yet. Topics will be added automatically
                    when you complete copy evaluations.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {revisions.map((revision) => {
                    const isDue = isPast(new Date(revision.nextRevisionAt));
                    return (
                      <div
                        key={revision.id}
                        className={`flex items-center justify-between rounded-lg border p-3 ${
                          isDue ? "border-primary bg-primary/5" : ""
                        }`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{revision.topic}</p>
                            <Badge variant="outline" className="text-xs">
                              {revision.subject}
                            </Badge>
                            {isDue && (
                              <Badge variant="default" className="text-xs">
                                Due Now
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Revised {revision.revisionCount} times</span>
                            <span>•</span>
                            <span>
                              Next: {format(new Date(revision.nextRevisionAt), "MMM d, yyyy")}
                            </span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <div
                                className={`h-2 w-2 rounded-full ${getDifficultyColor(
                                  revision.difficulty
                                )}`}
                              />
                              <span className="capitalize">{revision.difficulty}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quiz Dialog */}
      <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revision Quiz</DialogTitle>
            <DialogDescription>
              Test your knowledge and mark this topic as revised
            </DialogDescription>
          </DialogHeader>
          {quizRevision && (
            <RevisionQuiz
              topic={quizRevision.topic}
              subject={quizRevision.subject}
              revisionId={quizRevision.id}
              onComplete={handleQuizComplete}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
