"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, BookOpen, Play, TrendingUp } from "lucide-react";
import type { MockTest } from "@/db/schema";

interface TestDetailCardProps {
  test: MockTest;
}

export default function TestDetailCard({ test }: TestDetailCardProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const syllabus = test.syllabus ? JSON.parse(test.syllabus) : [];

  const handleStartTest = async () => {
    setIsStarting(true);
    try {
      // Create a new test attempt
      const response = await fetch("/api/mock-tests/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId: test.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to start test");
      }

      const { attemptId } = await response.json();
      
      // Navigate to test interface
      router.push(`/mock-tests/${attemptId}`);
    } catch (error) {
      console.error("Failed to start test:", error);
      alert("Failed to start test. Please try again.");
      setIsStarting(false);
    }
  };

  const handleViewHistory = () => {
    router.push(`/mock-tests/history/${test.id}`);
  };

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="line-clamp-2">{test.title}</CardTitle>
        <CardDescription className="line-clamp-3">
          {test.description || "No description available"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{test.duration} mins</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>{test.totalQuestions} questions</span>
          </div>
        </div>

        {syllabus.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>Syllabus Coverage</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {syllabus.slice(0, 3).map((topic: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {topic}
                </Badge>
              ))}
              {syllabus.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{syllabus.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button 
          onClick={handleStartTest} 
          disabled={isStarting}
          className="flex-1"
        >
          <Play className="h-4 w-4 mr-2" />
          {isStarting ? "Starting..." : "Start Test"}
        </Button>
        <Button 
          onClick={handleViewHistory} 
          variant="outline"
          size="icon"
          title="View History"
        >
          <TrendingUp className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
