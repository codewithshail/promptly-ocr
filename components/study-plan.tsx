"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Target,
  Calendar,
  CheckCircle2,
  Circle,
  Lightbulb,
  FileText,
} from "lucide-react";
import { WeakArea } from "@/lib/services/analytics.service";
import { useRouter } from "next/navigation";

interface StudyPlanProps {
  userId: string;
}

interface StudyPlanItem {
  id: string;
  subject: string;
  priority: "high" | "medium" | "low";
  currentScore: number;
  targetScore: number;
  estimatedDays: number;
  actions: Array<{
    type: "tips" | "template" | "practice" | "revision";
    title: string;
    completed: boolean;
  }>;
}

export function StudyPlan({ userId }: StudyPlanProps) {
  const router = useRouter();
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeakAreas = async () => {
      try {
        const response = await fetch("/api/analytics/weak-areas");
        if (response.ok) {
          const data = await response.json();
          setWeakAreas(data.weakAreas || []);
        }
      } catch (error) {
        console.error("Failed to fetch weak areas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeakAreas();
  }, [userId]);

  const generateStudyPlan = (areas: WeakArea[]): StudyPlanItem[] => {
    return areas.slice(0, 5).map((area, index) => {
      const priority =
        area.averageScore < 40
          ? "high"
          : area.averageScore < 50
          ? "medium"
          : "low";

      const targetScore = 70;
      const scoreGap = targetScore - area.averageScore;
      const estimatedDays = Math.ceil(scoreGap / 2); // Rough estimate: 2% improvement per day

      return {
        id: `plan-${index}`,
        subject: area.subject,
        priority,
        currentScore: area.averageScore,
        targetScore,
        estimatedDays,
        actions: [
          {
            type: "tips",
            title: `Study tips for ${area.subject}`,
            completed: false,
          },
          {
            type: "template",
            title: "Review answer templates",
            completed: false,
          },
          {
            type: "practice",
            title: "Complete practice questions",
            completed: false,
          },
          {
            type: "revision",
            title: "Schedule revision",
            completed: false,
          },
        ],
      };
    });
  };

  const studyPlan = generateStudyPlan(weakAreas);

  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "medium":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "low":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "tips":
        return <Lightbulb className="h-4 w-4" />;
      case "template":
        return <FileText className="h-4 w-4" />;
      case "practice":
        return <Target className="h-4 w-4" />;
      case "revision":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const handleActionClick = (subject: string, actionType: string) => {
    switch (actionType) {
      case "tips":
        router.push(`/tips?subject=${encodeURIComponent(subject)}`);
        break;
      case "template":
        router.push("/templates");
        break;
      case "practice":
        router.push("/mock-tests");
        break;
      case "revision":
        router.push("/revision");
        break;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Your Study Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Generating your personalized study plan...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (studyPlan.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Your Study Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              You're doing great!
            </h3>
            <p className="text-muted-foreground">
              No weak areas detected. Keep up the excellent work!
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
          <BookOpen className="h-5 w-5" />
          Your Personalized Study Plan
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Focus on these areas to improve your overall performance
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {studyPlan.map((item, index) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-lg">
                      {index + 1}. {item.subject}
                    </span>
                    <Badge
                      className={getPriorityColor(item.priority)}
                      variant="secondary"
                    >
                      {item.priority} priority
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Current: {item.currentScore}%</span>
                    <span>→</span>
                    <span>Target: {item.targetScore}%</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      ~{item.estimatedDays} days
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium mb-2">Action Items:</p>
                {item.actions.map((action, actionIndex) => (
                  <button
                    key={actionIndex}
                    onClick={() => handleActionClick(item.subject, action.type)}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left"
                  >
                    {action.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="flex items-center gap-2 flex-1">
                      {getActionIcon(action.type)}
                      <span className="text-sm">{action.title}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Study Tips
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Focus on high-priority areas first</li>
            <li>• Complete at least one action item daily</li>
            <li>• Review templates before attempting practice questions</li>
            <li>• Schedule regular revisions to retain knowledge</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
