"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, Target } from "lucide-react";
import { WeakArea } from "@/lib/services/analytics.service";

interface ImprovementTrackerProps {
  userId: string;
}

export function ImprovementTracker({ userId }: ImprovementTrackerProps) {
  const [improvedAreas, setImprovedAreas] = useState<WeakArea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImprovedAreas = async () => {
      try {
        const response = await fetch("/api/analytics/improved-areas");
        if (response.ok) {
          const data = await response.json();
          setImprovedAreas(data.improvedAreas || []);
        }
      } catch (error) {
        console.error("Failed to fetch improved areas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImprovedAreas();
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Your Improvements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading improvements...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (improvedAreas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Your Improvements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Keep practicing! Your improvements will appear here as you progress.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          Your Improvements
          <Badge variant="secondary">{improvedAreas.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {improvedAreas.map((area, index) => (
            <div
              key={`${area.subject}-${index}`}
              className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold flex items-center gap-2">
                    {area.topic}
                    <Badge variant="default" className="bg-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Improved
                    </Badge>
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {area.attemptCount} attempts
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                  <div className="text-lg font-bold text-red-600">
                    {area.firstScore}%
                  </div>
                  <div className="text-xs text-muted-foreground">Started</div>
                </div>
                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                  <div className="text-lg font-bold text-green-600">
                    +{area.trendPercentage}%
                  </div>
                  <div className="text-xs text-muted-foreground">Growth</div>
                </div>
                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                  <div className="text-lg font-bold text-green-600">
                    {area.lastScore}%
                  </div>
                  <div className="text-xs text-muted-foreground">Current</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Average Score:</span>
                  <span className="font-semibold text-green-600">
                    {area.averageScore}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
