"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Trophy, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DailyQuizCardProps {
  onStartQuiz: () => void;
}

export function DailyQuizCard({ onStartQuiz }: DailyQuizCardProps) {
  const [quizStatus, setQuizStatus] = useState<"not_started" | "completed" | "loading">("loading");
  const [todayScore, setTodayScore] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkQuizStatus();
  }, []);

  const checkQuizStatus = async () => {
    try {
      const response = await fetch("/api/quiz/daily");
      if (!response.ok) {
        throw new Error("Failed to fetch quiz status");
      }
      const data = await response.json();
      
      if (data.attempted) {
        setQuizStatus("completed");
        setTodayScore(data.score);
      } else {
        setQuizStatus("not_started");
      }
    } catch (error) {
      console.error("Error checking quiz status:", error);
      setQuizStatus("not_started");
    }
  };

  const handleStartQuiz = () => {
    if (quizStatus === "completed") {
      toast({
        title: "Quiz Already Completed",
        description: "You've already completed today's quiz. Come back tomorrow for a new one!",
      });
      return;
    }
    onStartQuiz();
  };

  if (quizStatus === "loading") {
    return (
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <CardTitle>Daily Current Affairs Quiz</CardTitle>
          </div>
          <CardDescription>Loading quiz status...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <CardTitle>Daily Current Affairs Quiz</CardTitle>
        </div>
        <CardDescription>
          Test your knowledge with 10 questions from recent news
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {quizStatus === "completed" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 p-6 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {todayScore}/10
                </p>
                <p className="text-sm text-muted-foreground">Today's Score</p>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Great job! Come back tomorrow for a new quiz.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>10 Questions</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span>Instant Feedback</span>
              </div>
            </div>
            <Button onClick={handleStartQuiz} className="w-full" size="lg">
              Start Today's Quiz
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
