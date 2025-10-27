"use client";

import { useState, useEffect } from "react";
import { LeaderboardTable } from "@/components/leaderboard-table";
import {
  LeaderboardEntry,
  UserRankInfo,
} from "@/lib/services/analytics.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Users, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LeaderboardClientProps {
  userId: string;
}

type TimeFilter = "all-time" | "monthly" | "weekly";

export function LeaderboardClient({ userId }: LeaderboardClientProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRankInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all-time");
  const [isOptedOut, setIsOptedOut] = useState(false);
  const [showOptInPrompt, setShowOptInPrompt] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [timeFilter]);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/leaderboard?filter=${timeFilter}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setIsOptedOut(true);
          setShowOptInPrompt(true);
        } else {
          throw new Error(data.error || "Failed to fetch leaderboard");
        }
        return;
      }

      setLeaderboard(data.leaderboard);
      setUserRank(data.userRank);
      setIsOptedOut(false);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load leaderboard"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptIn = async () => {
    try {
      const response = await fetch("/api/leaderboard/opt-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optIn: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to opt in");
      }

      setShowOptInPrompt(false);
      fetchLeaderboard();
    } catch (err) {
      console.error("Error opting in:", err);
      setError("Failed to opt in to leaderboard");
    }
  };

  if (isLoading) {
    return <LeaderboardLoadingSkeleton />;
  }

  if (showOptInPrompt) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground mt-2">
            Compare your performance with peers anonymously
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="space-y-4">
            <p>
              You are currently not participating in the leaderboard. Join to
              see how you compare with other UPSC aspirants!
            </p>
            <p className="text-sm text-muted-foreground">
              Your identity will remain anonymous. Only your performance metrics
              will be visible with a random user ID.
            </p>
            <Button onClick={handleOptIn} className="mt-2">
              Join Leaderboard
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground mt-2">
          Compare your performance with peers anonymously
        </p>
      </div>

      {/* User Rank Card */}
      {userRank && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Your Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Rank</p>
                <p className="text-2xl font-bold">#{userRank.rank}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold">
                  {userRank.totalPoints.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Percentile</p>
                <p className="text-2xl font-bold text-primary">
                  Top {100 - userRank.percentile}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{userRank.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Filter Tabs */}
      <Tabs
        value={timeFilter}
        onValueChange={(v) => setTimeFilter(v as TimeFilter)}
      >
        <TabsList>
          <TabsTrigger value="all-time">All Time</TabsTrigger>
          <TabsTrigger value="monthly">This Month</TabsTrigger>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
        </TabsList>

        <TabsContent value={timeFilter} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top 100 Rankings
              </CardTitle>
              <CardDescription>
                Anonymous rankings based on performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaderboardTable entries={leaderboard} currentUserId={userId} />
            </CardContent>
          </Card>

          {/* Points Calculation Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                How Points Are Calculated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Score</span>
                  <span className="font-medium">40% weight</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Streak</span>
                  <span className="font-medium">20% weight</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tests Completed</span>
                  <span className="font-medium">20% weight</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Evaluations Completed
                  </span>
                  <span className="font-medium">20% weight</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LeaderboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
