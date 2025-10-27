"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlashcardDeck } from "@/components/flashcard-deck";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Trophy, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  sourceType?: string;
  sourceId?: string;
  nextReviewAt?: string;
  reviewCount: number;
}

export default function FlashcardsPage() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeck, setShowDeck] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    dueToday: 0,
    mastered: 0,
  });

  useEffect(() => {
    if (isLoaded && user) {
      fetchFlashcards();
    }
  }, [isLoaded, user]);

  const fetchFlashcards = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/flashcards");
      
      if (!response.ok) {
        throw new Error("Failed to fetch flashcards");
      }

      const data = await response.json();
      setFlashcards(data.flashcards || []);
      setStats(data.stats || { total: 0, dueToday: 0, mastered: 0 });
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      toast({
        title: "Error",
        description: "Failed to load flashcards",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (flashcardId: string, difficulty: "easy" | "medium" | "hard") => {
    try {
      const response = await fetch("/api/flashcards/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcardId, difficulty }),
      });

      if (!response.ok) {
        throw new Error("Failed to record review");
      }
    } catch (error) {
      console.error("Error recording review:", error);
      throw error;
    }
  };

  const handleComplete = () => {
    setShowDeck(false);
    toast({
      title: "Great Job!",
      description: "You've completed all your flashcards for today.",
    });
    fetchFlashcards(); // Refresh stats
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (showDeck && flashcards.length > 0) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Flashcard Review</h1>
              <p className="text-muted-foreground mt-2">
                Review your flashcards using spaced repetition
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowDeck(false)}>
              Exit Review
            </Button>
          </div>
          <FlashcardDeck
            flashcards={flashcards}
            onReview={handleReview}
            onComplete={handleComplete}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
          <p className="text-muted-foreground mt-2">
            Learn and retain current affairs using spaced repetition
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Flashcards</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Due Today</CardDescription>
              <CardTitle className="text-3xl text-primary">{stats.dueToday}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Mastered</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.mastered}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Main Action Card */}
        {stats.dueToday > 0 ? (
          <Card className="border-2 border-primary">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <CardTitle>Ready to Review</CardTitle>
              </div>
              <CardDescription>
                You have {stats.dueToday} flashcard{stats.dueToday !== 1 ? "s" : ""} due for review today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowDeck(true)} size="lg" className="w-full">
                Start Review Session
              </Button>
            </CardContent>
          </Card>
        ) : stats.total > 0 ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-green-600" />
                <CardTitle>All Caught Up!</CardTitle>
              </div>
              <CardDescription>
                You've reviewed all your flashcards for today. Great work!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Come back tomorrow for your next review session, or create new flashcards from news articles.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={fetchFlashcards}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Link href="/current-affairs">
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create from News
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Flashcards Yet</CardTitle>
              <CardDescription>
                Create flashcards from news articles to start learning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/current-affairs">
                <Button size="lg" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Flashcard
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* How it Works */}
        <Card>
          <CardHeader>
            <CardTitle>How Spaced Repetition Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium">Create Flashcards</p>
                  <p className="text-sm text-muted-foreground">
                    Generate flashcards from news articles or create your own
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium">Review Regularly</p>
                  <p className="text-sm text-muted-foreground">
                    Rate each card as Easy, Medium, or Hard based on how well you knew it
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium">Optimize Learning</p>
                  <p className="text-sm text-muted-foreground">
                    Cards you find difficult appear more frequently, while easy cards appear less often
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
