"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeakAreasDisplay } from "@/components/weak-areas-display";
import { StudyPlan } from "@/components/study-plan";
import { WeakArea } from "@/lib/services/analytics.service";
import {
  BookOpen,
  TrendingUp,
  Target,
  Flame,
  FileText,
  Award,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";

interface DashboardClientProps {
  userId: string;
}

export function DashboardClient({ userId }: DashboardClientProps) {
  const router = useRouter();
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [stats, setStats] = useState({
    totalEvaluations: 0,
    averageScore: 0,
    currentStreak: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch weak areas
        const weakAreasResponse = await fetch("/api/analytics/weak-areas");
        if (weakAreasResponse.ok) {
          const weakAreasData = await weakAreasResponse.json();
          setWeakAreas(weakAreasData.weakAreas || []);
        }

        // Fetch user stats
        const prefsResponse = await fetch("/api/preferences");
        if (prefsResponse.ok) {
          const prefsData = await prefsResponse.json();
          setStats({
            totalEvaluations: 0, // Will be populated from analytics
            averageScore: 0,
            currentStreak: prefsData.dailyStreak || 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's your learning overview
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentStreak} days</div>
            <p className="text-xs text-muted-foreground">
              Keep it up! Stay consistent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Evaluations
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvaluations}</div>
            <p className="text-xs text-muted-foreground">Answers evaluated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}/100</div>
            <p className="text-xs text-muted-foreground">
              Across all evaluations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              onClick={() => router.push("/chatbot")}
            >
              <BookOpen className="h-6 w-6" />
              <span>Start Chat</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              onClick={() => router.push("/copy-checking")}
            >
              <FileText className="h-6 w-6" />
              <span>Check Copy</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              onClick={() => router.push("/mock-tests")}
            >
              <Target className="h-6 w-6" />
              <span>Take Test</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              onClick={() => router.push("/current-affairs")}
            >
              <TrendingUp className="h-6 w-6" />
              <span>Read News</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Top 3 Weak Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Areas to Focus On</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/profile?tab=progress")}
            >
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WeakAreasDisplay weakAreas={weakAreas} showAll={false} />
        </CardContent>
      </Card>

      {/* Study Plan Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Study Plan</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/profile?tab=progress")}
            >
              View Full Plan
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StudyPlan userId={userId} />
        </CardContent>
      </Card>
    </div>
  );
}
