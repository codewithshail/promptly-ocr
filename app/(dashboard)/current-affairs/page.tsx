"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { usePreferences } from "@/hooks/use-preferences";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trophy, ArrowLeft, Plus, Check } from "lucide-react";
import { NewsFeed, type NewsArticle } from "@/components/news-feed";
import { NewsFeedSkeleton } from "@/components/skeletons";
import { NewsFeedErrorBoundary } from "@/components/error-boundary";
import { DailyQuizCard } from "@/components/daily-quiz-card";
import { QuizInterface } from "@/components/quiz-interface";
import { FlashcardCreator } from "@/components/flashcard-creator";
import { PreferenceBanner } from "@/components/preference-banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function CurrentAffairsPage() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const { preferences, isLoading: prefsLoading } = usePreferences();
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [showFlashcardCreator, setShowFlashcardCreator] = useState(false);

  // Check if user has set news preferences
  const hasPreferences = preferences?.newsCategories && 
    Array.isArray(preferences.newsCategories) && 
    preferences.newsCategories.length > 0;

  const handleStartQuiz = async () => {
    try {
      setIsLoadingQuiz(true);
      const response = await fetch("/api/quiz/daily");
      
      if (!response.ok) {
        throw new Error("Failed to fetch quiz");
      }

      const data = await response.json();
      
      if (data.attempted) {
        toast({
          title: "Quiz Already Completed",
          description: "You've already completed today's quiz!",
        });
        return;
      }

      if (!data.quiz || !data.quiz.questions) {
        toast({
          title: "No Quiz Available",
          description: "Today's quiz is not ready yet. Please check back later.",
          variant: "destructive",
        });
        return;
      }

      setQuizQuestions(data.quiz.questions);
      setShowQuiz(true);
    } catch (error) {
      console.error("Error loading quiz:", error);
      toast({
        title: "Error",
        description: "Failed to load quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleQuizComplete = (score: number) => {
    setQuizScore(score);
    setShowQuiz(false);
    
    toast({
      title: "Quiz Complete!",
      description: `You scored ${score} out of ${quizQuestions.length}`,
    });
  };

  const handleBackToNews = () => {
    setShowQuiz(false);
    setQuizScore(null);
  };

  if (!isLoaded || prefsLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Current Affairs</h1>
            <p className="text-muted-foreground mt-2">
              Stay updated with UPSC-relevant news. Select your preferred categories to personalize your feed.
            </p>
          </div>
          <NewsFeedSkeleton />
        </div>
      </div>
    );
  }

  // Show quiz interface if quiz is active
  if (showQuiz && quizQuestions.length > 0) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToNews}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to News
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Daily Current Affairs Quiz</h1>
            <p className="text-muted-foreground mt-2">
              Test your knowledge with questions from recent news
            </p>
          </div>
          <QuizInterface
            questions={quizQuestions}
            onComplete={handleQuizComplete}
          />
        </div>
      </div>
    );
  }

  // Show quiz results if completed
  if (quizScore !== null) {
    const percentage = (quizScore / quizQuestions.length) * 100;
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          <Card className="border-2 border-primary">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Trophy className="h-16 w-16 text-yellow-500" />
              </div>
              <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
              <CardDescription>Here's how you did</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-6xl font-bold text-primary mb-2">
                  {quizScore}/{quizQuestions.length}
                </p>
                <p className="text-xl text-muted-foreground">
                  {percentage}% Correct
                </p>
              </div>
              <div className="space-y-2">
                {percentage >= 80 && (
                  <p className="text-center text-green-600 font-semibold">
                    Excellent work! You're well-informed on current affairs.
                  </p>
                )}
                {percentage >= 60 && percentage < 80 && (
                  <p className="text-center text-blue-600 font-semibold">
                    Good job! Keep reading to improve further.
                  </p>
                )}
                {percentage < 60 && (
                  <p className="text-center text-orange-600 font-semibold">
                    Keep practicing! Read more news articles to improve.
                  </p>
                )}
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleBackToNews} size="lg">
                  Back to News Feed
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <NewsFeedErrorBoundary>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Current Affairs</h1>
            <p className="text-muted-foreground mt-2">
              Stay updated with UPSC-relevant news from trusted sources.
            </p>
          </div>

          {/* Preference Banner - Show only when no preferences set */}
          {!hasPreferences && <PreferenceBanner />}

          {/* Daily Quiz Card */}
          <DailyQuizCard onStartQuiz={handleStartQuiz} />

          {/* News Feed Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">
              {hasPreferences ? "Your Personalized Feed" : "Latest News"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {hasPreferences
                ? "Articles from your preferred categories appear first"
                : "All news articles sorted by most recent"}
            </p>
            {user && (
              <NewsFeed
                userId={user.id}
                onArticleClick={(article) => {
                  setSelectedArticle(article);
                  setIsDetailOpen(true);
                }}
              />
            )}
          </div>
        </div>

      {/* News Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedArticle && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl leading-tight">
                  {selectedArticle.title}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-4 text-sm">
                  <span>{selectedArticle.source}</span>
                  <span>•</span>
                  <span>
                    {new Date(selectedArticle.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedArticle.imageUrl && (
                  <img
                    src={selectedArticle.imageUrl}
                    alt={selectedArticle.title}
                    className="w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="text-base leading-relaxed whitespace-pre-wrap">
                    {selectedArticle.content || selectedArticle.summary}
                  </p>
                </div>
                <div className="pt-4 border-t flex items-center justify-between gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowFlashcardCreator(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Flashcards
                  </Button>
                  {selectedArticle.externalUrl && (
                    <a
                      href={selectedArticle.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-2"
                    >
                      Read full article on {selectedArticle.source}
                      <Check className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Flashcard Creator Dialog */}
      {selectedArticle && (
        <FlashcardCreator
          open={showFlashcardCreator}
          onOpenChange={setShowFlashcardCreator}
          articleId={selectedArticle.id}
          articleTitle={selectedArticle.title}
          articleContent={selectedArticle.content || selectedArticle.summary || ""}
          onSuccess={() => {
            toast({
              title: "Success",
              description: "Flashcards created! Visit the Flashcards page to review them.",
            });
          }}
        />
      )}
      </div>
    </NewsFeedErrorBoundary>
  );
}
