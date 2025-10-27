"use client";

import { WeakArea } from "@/lib/services/analytics.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Target,
  BookOpen,
  FileText,
  Lightbulb,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface WeakAreasDisplayProps {
  weakAreas: WeakArea[];
  showAll?: boolean;
  onFocusArea?: (area: WeakArea) => void;
}

export function WeakAreasDisplay({
  weakAreas,
  showAll = false,
  onFocusArea,
}: WeakAreasDisplayProps) {
  const router = useRouter();

  const displayedAreas = showAll ? weakAreas : weakAreas.slice(0, 3);

  if (weakAreas.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No Weak Areas Detected!
            </h3>
            <p className="text-muted-foreground">
              Keep up the great work! All your subjects are performing well.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score < 40) return "text-red-600";
    if (score < 60) return "text-orange-600";
    return "text-yellow-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score < 40) return "bg-red-100";
    if (score < 60) return "bg-orange-100";
    return "bg-yellow-100";
  };

  const getTrendIcon = (trend: "improving" | "declining" | "stable") => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "stable":
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendBadgeVariant = (
    trend: "improving" | "declining" | "stable"
  ) => {
    switch (trend) {
      case "improving":
        return "default";
      case "declining":
        return "destructive";
      case "stable":
        return "secondary";
    }
  };

  const handleFocusArea = (area: WeakArea) => {
    if (onFocusArea) {
      onFocusArea(area);
    } else {
      // Default behavior: navigate to tips page for that subject
      router.push(`/tips?subject=${encodeURIComponent(area.subject)}`);
    }
  };

  return (
    <div className="space-y-4">
      {displayedAreas.map((area, index) => (
        <Card key={`${area.subject}-${index}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>{area.topic}</span>
                  <Badge
                    variant={getTrendBadgeVariant(area.trend)}
                    className="flex items-center gap-1"
                  >
                    {getTrendIcon(area.trend)}
                    <span className="capitalize">{area.trend}</span>
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {area.attemptCount} attempt{area.attemptCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div
                className={`text-right px-3 py-1 rounded-lg ${getScoreBgColor(
                  area.averageScore
                )}`}
              >
                <div className={`text-2xl font-bold ${getScoreColor(area.averageScore)}`}>
                  {area.averageScore}%
                </div>
                <div className="text-xs text-muted-foreground">Avg Score</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Score Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress to Target (60%)</span>
                <span className="font-medium">
                  {Math.min(100, Math.round((area.averageScore / 60) * 100))}%
                </span>
              </div>
              <Progress
                value={Math.min(100, (area.averageScore / 60) * 100)}
                className="h-2"
              />
            </div>

            {/* Score Trend */}
            {area.attemptCount >= 2 && (
              <div className="flex items-center justify-between text-sm bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">First Score:</span>
                  <span className="font-semibold">{area.firstScore}%</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  →
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Latest Score:</span>
                  <span className="font-semibold">{area.lastScore}%</span>
                </div>
                {area.trendPercentage !== 0 && (
                  <Badge
                    variant={area.trendPercentage > 0 ? "default" : "destructive"}
                    className="ml-2"
                  >
                    {area.trendPercentage > 0 ? "+" : ""}
                    {area.trendPercentage}%
                  </Badge>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => handleFocusArea(area)}
                className="flex-1"
                size="sm"
              >
                <Target className="h-4 w-4 mr-2" />
                Focus on This
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/tips?subject=${encodeURIComponent(area.subject)}`)}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Tips
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/templates")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Templates
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {!showAll && weakAreas.length > 3 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/profile?tab=weak-areas")}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          View All {weakAreas.length} Weak Areas
        </Button>
      )}
    </div>
  );
}
