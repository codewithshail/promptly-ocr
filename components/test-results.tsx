"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Circle, Clock, Award, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import type { MockTestEvaluationResult } from "@/lib/services/mock-test.service";

interface TestResultsProps {
  testTitle: string;
  evaluationResult: MockTestEvaluationResult;
  timeSpent: number; // in seconds
  testId: string;
}

export default function TestResults({
  testTitle,
  evaluationResult,
  timeSpent,
  testId,
}: TestResultsProps) {
  const router = useRouter();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 75) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (percentage: number): "default" | "secondary" | "destructive" => {
    if (percentage >= 75) return "default";
    if (percentage >= 50) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Test Results</h1>
        <p className="text-muted-foreground mt-2">{testTitle}</p>
      </div>

      {/* Score Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${getScoreColor(evaluationResult.percentage)}`}>
              {evaluationResult.totalScore}/{evaluationResult.maxScore}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {evaluationResult.percentage.toFixed(1)}%
            </p>
            <Progress value={evaluationResult.percentage} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {evaluationResult.correctAnswers}/{evaluationResult.correctAnswers + evaluationResult.incorrectAnswers}
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                {evaluationResult.correctAnswers} correct
              </div>
              <div className="flex items-center gap-1 text-red-600">
                <XCircle className="h-4 w-4" />
                {evaluationResult.incorrectAnswers} wrong
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Time Taken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{formatTime(timeSpent)}</div>
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Avg: {formatTime(Math.floor(timeSpent / evaluationResult.questionResults.length))} per question
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Badge */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Performance Rating</p>
                <p className="text-sm text-muted-foreground">
                  {evaluationResult.percentage >= 75
                    ? "Excellent! Keep up the great work!"
                    : evaluationResult.percentage >= 50
                    ? "Good effort! Review the incorrect answers to improve."
                    : "Needs improvement. Focus on understanding the concepts."}
                </p>
              </div>
            </div>
            <Badge variant={getScoreBadgeVariant(evaluationResult.percentage)} className="text-lg px-4 py-2">
              {evaluationResult.percentage >= 75
                ? "Excellent"
                : evaluationResult.percentage >= 50
                ? "Good"
                : "Needs Work"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Question-wise Results */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analysis</CardTitle>
          <CardDescription>
            Review your answers and explanations for each question
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {evaluationResult.questionResults.map((result, index) => (
            <div
              key={result.questionId}
              className={`p-4 rounded-lg border-2 ${
                result.isCorrect
                  ? "border-green-200 bg-green-50"
                  : result.userAnswer === -1
                  ? "border-gray-200 bg-gray-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {result.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : result.userAnswer === -1 ? (
                    <Circle className="h-5 w-5 text-gray-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <p className="font-medium">
                      Question {index + 1}: {result.question}
                    </p>
                    <Badge variant="outline">{result.marks} marks</Badge>
                  </div>

                  <div className="space-y-1 text-sm">
                    {result.userAnswer !== -1 ? (
                      <p>
                        <span className="font-medium">Your answer:</span>{" "}
                        <span className={result.isCorrect ? "text-green-600" : "text-red-600"}>
                          Option {String.fromCharCode(65 + result.userAnswer)}
                        </span>
                      </p>
                    ) : (
                      <p className="text-gray-600">
                        <span className="font-medium">Not answered</span>
                      </p>
                    )}
                    
                    {!result.isCorrect && (
                      <p>
                        <span className="font-medium">Correct answer:</span>{" "}
                        <span className="text-green-600">
                          Option {String.fromCharCode(65 + result.correctAnswer)}
                        </span>
                      </p>
                    )}
                  </div>

                  {result.explanation && (
                    <div className="mt-2 p-3 bg-white rounded border">
                      <p className="text-sm font-medium mb-1">Explanation:</p>
                      <p className="text-sm text-muted-foreground">{result.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={() => router.push("/mock-tests")} variant="outline">
          Back to Tests
        </Button>
        <Button onClick={() => router.push(`/mock-tests/history/${testId}`)}>
          <TrendingUp className="h-4 w-4 mr-2" />
          View Performance History
        </Button>
      </div>
    </div>
  );
}
