"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Award, Flame, FileText, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PerformanceStats {
  userAverageScore: number;
  platformAverageScore: number;
  userStreak: number;
  platformAverageStreak: number;
  userTestsCompleted: number;
  platformAverageTests: number;
  userEvaluations: number;
  platformAverageEvaluations: number;
  percentile: number;
}

interface PerformanceComparisonProps {
  userId: string;
}

export function PerformanceComparison({ userId }: PerformanceComparisonProps) {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/leaderboard/comparison");
      
      if (!response.ok) {
        throw new Error("Failed to fetch comparison data");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching performance comparison:", err);
      setError(err instanceof Error ? err.message : "Failed to load comparison");
    } finally {
      setIsLoading(false);
    }
  };

  const getComparisonIcon = (userValue: number, platformValue: number) => {
    if (userValue > platformValue) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (userValue < platformValue) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getComparisonText = (userValue: number, platformValue: number) => {
    const diff = userValue - platformValue;
    const percentage = platformValue > 0 ? Math.abs((diff / platformValue) * 100) : 0;
    
    if (diff > 0) {
      return (
        <span className="text-green-600 font-medium">
          +{percentage.toFixed(1)}% above average
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className="text-red-600 font-medium">
          {percentage.toFixed(1)}% below average
        </span>
      );
    }
    return <span className="text-muted-foreground">At average</span>;
  };

  const getMotivationalMessage = () => {
    if (!stats) return "";

    const { percentile, userAverageScore, platformAverageScore } = stats;

    if (percentile >= 90) {
      return "Outstanding! You're in the top 10% of all users. Keep up the excellent work!";
    } else if (percentile >= 75) {
      return "Great job! You're performing better than most users. Stay consistent!";
    } else if (percentile >= 50) {
      return "Good progress! You're above average. Keep pushing to reach the top!";
    } else if (userAverageScore > platformAverageScore) {
      return "You're doing well! Focus on consistency to climb higher in the rankings.";
    } else {
      return "Keep going! Every evaluation brings you closer to your goal. Stay motivated!";
    }
  };

  if (isLoading) {
    return <PerformanceComparisonSkeleton />;
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            {error || "Unable to load performance comparison"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Percentile Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Your Performance Ranking
          </CardTitle>
          <CardDescription>
            {getMotivationalMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Percentile</span>
            <Badge variant="secondary" className="text-lg">
              Top {100 - stats.percentile}%
            </Badge>
          </div>
          <Progress value={stats.percentile} className="h-3" />
        </CardContent>
      </Card>

      {/* Detailed Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Performance vs Platform Average</CardTitle>
          <CardDescription>
            See how you compare with other UPSC aspirants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Average Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Average Score</span>
              </div>
              {getComparisonIcon(stats.userAverageScore, stats.platformAverageScore)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Your Score</p>
                <p className="text-2xl font-bold">{stats.userAverageScore.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Platform Average</p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {stats.platformAverageScore.toFixed(1)}
                </p>
              </div>
            </div>
            <div className="text-sm">
              {getComparisonText(stats.userAverageScore, stats.platformAverageScore)}
            </div>
            <Progress
              value={(stats.userAverageScore / 100) * 100}
              className="h-2"
            />
          </div>

          {/* Daily Streak */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <span className="font-medium">Daily Streak</span>
              </div>
              {getComparisonIcon(stats.userStreak, stats.platformAverageStreak)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Your Streak</p>
                <p className="text-2xl font-bold">{stats.userStreak} days</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Platform Average</p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {stats.platformAverageStreak.toFixed(1)} days
                </p>
              </div>
            </div>
            <div className="text-sm">
              {getComparisonText(stats.userStreak, stats.platformAverageStreak)}
            </div>
          </div>

          {/* Tests Completed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-500" />
                <span className="font-medium">Tests Completed</span>
              </div>
              {getComparisonIcon(stats.userTestsCompleted, stats.platformAverageTests)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Your Tests</p>
                <p className="text-2xl font-bold">{stats.userTestsCompleted}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Platform Average</p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {stats.platformAverageTests.toFixed(1)}
                </p>
              </div>
            </div>
            <div className="text-sm">
              {getComparisonText(stats.userTestsCompleted, stats.platformAverageTests)}
            </div>
          </div>

          {/* Evaluations Completed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                <span className="font-medium">Evaluations Completed</span>
              </div>
              {getComparisonIcon(stats.userEvaluations, stats.platformAverageEvaluations)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Your Evaluations</p>
                <p className="text-2xl font-bold">{stats.userEvaluations}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Platform Average</p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {stats.platformAverageEvaluations.toFixed(1)}
                </p>
              </div>
            </div>
            <div className="text-sm">
              {getComparisonText(stats.userEvaluations, stats.platformAverageEvaluations)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PerformanceComparisonSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
