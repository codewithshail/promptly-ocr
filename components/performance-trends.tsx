"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, Target, Calendar } from "lucide-react";
import type { MockTestAttempt } from "@/db/schema";
import type { MockTestEvaluationResult } from "@/lib/services/mock-test.service";

interface PerformanceTrendsProps {
  attempts: MockTestAttempt[];
  testTitle: string;
}

interface AttemptData {
  attemptNumber: number;
  date: Date;
  score: number;
  percentage: number;
  timeSpent: number;
  correctAnswers: number;
  totalQuestions: number;
}

export default function PerformanceTrends({ attempts, testTitle }: PerformanceTrendsProps) {
  // Parse and sort attempts
  const attemptData: AttemptData[] = attempts
    .filter((a) => a.status === "completed" && a.evaluationResult)
    .map((attempt, index) => {
      const evaluation: MockTestEvaluationResult = JSON.parse(attempt.evaluationResult!);
      return {
        attemptNumber: attempts.length - index,
        date: attempt.completedAt || attempt.startedAt,
        score: attempt.score || 0,
        percentage: evaluation.percentage,
        timeSpent: attempt.timeSpent || 0,
        correctAnswers: evaluation.correctAnswers,
        totalQuestions: evaluation.questionResults.length,
      };
    })
    .reverse();

  if (attemptData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>No completed attempts yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Calculate statistics
  const latestAttempt = attemptData[attemptData.length - 1];
  const previousAttempt = attemptData.length > 1 ? attemptData[attemptData.length - 2] : null;
  
  const averageScore = attemptData.reduce((sum, a) => sum + a.score, 0) / attemptData.length;
  const averagePercentage = attemptData.reduce((sum, a) => sum + a.percentage, 0) / attemptData.length;
  const averageTime = attemptData.reduce((sum, a) => sum + a.timeSpent, 0) / attemptData.length;
  
  const bestScore = Math.max(...attemptData.map((a) => a.score));
  const bestPercentage = Math.max(...attemptData.map((a) => a.percentage));

  const scoreImprovement = previousAttempt
    ? latestAttempt.percentage - previousAttempt.percentage
    : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Performance Trends</h2>
        <p className="text-muted-foreground mt-1">{testTitle}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{attemptData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last: {formatDate(latestAttempt.date)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Best Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {bestPercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {bestScore} marks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {averagePercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {averageScore.toFixed(1)} marks avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatTime(Math.floor(averageTime))}</div>
            <p className="text-xs text-muted-foreground mt-1">
              per attempt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Improvement Indicator */}
      {previousAttempt && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {scoreImprovement >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
                <div>
                  <p className="font-medium">
                    {scoreImprovement >= 0 ? "Improvement" : "Decline"} from Last Attempt
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {scoreImprovement >= 0 ? "+" : ""}
                    {scoreImprovement.toFixed(1)}% compared to previous attempt
                  </p>
                </div>
              </div>
              <Badge
                variant={scoreImprovement >= 0 ? "default" : "destructive"}
                className="text-lg px-4 py-2"
              >
                {scoreImprovement >= 0 ? "+" : ""}
                {scoreImprovement.toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attempt History */}
      <Card>
        <CardHeader>
          <CardTitle>Attempt History</CardTitle>
          <CardDescription>
            Detailed breakdown of all your attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attemptData.map((attempt) => (
              <div
                key={attempt.attemptNumber}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <Badge variant="outline" className="mb-1">
                      #{attempt.attemptNumber}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(attempt.date)}
                    </span>
                  </div>
                  
                  <div className="h-12 w-px bg-border" />
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {attempt.score} marks ({attempt.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(attempt.timeSpent)}</span>
                      <span className="mx-1">•</span>
                      <span>
                        {attempt.correctAnswers}/{attempt.totalQuestions} correct
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div
                      className={`h-full rounded-full ${
                        attempt.percentage >= 75
                          ? "bg-green-500"
                          : attempt.percentage >= 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${attempt.percentage}%` }}
                    />
                  </div>
                  <Badge
                    variant={
                      attempt.percentage >= 75
                        ? "default"
                        : attempt.percentage >= 50
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {attempt.percentage >= 75
                      ? "Excellent"
                      : attempt.percentage >= 50
                      ? "Good"
                      : "Needs Work"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Time Analysis</CardTitle>
          <CardDescription>
            Average time spent per question across attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attemptData.map((attempt) => {
              const avgTimePerQuestion = attempt.timeSpent / attempt.totalQuestions;
              return (
                <div key={attempt.attemptNumber} className="flex items-center gap-4">
                  <span className="text-sm font-medium w-20">
                    Attempt #{attempt.attemptNumber}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">
                        {formatTime(Math.floor(avgTimePerQuestion))} per question
                      </span>
                      <span className="text-sm font-medium">
                        {formatTime(attempt.timeSpent)} total
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{
                          width: `${Math.min((attempt.timeSpent / (attemptData[0].timeSpent * 1.2)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
