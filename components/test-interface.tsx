"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Clock, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import type { Question } from "@/lib/services/mock-test.service";

interface TestInterfaceProps {
  attemptId: string;
  testTitle: string;
  duration: number; // in minutes
  questions: Question[];
}

export default function TestInterface({
  attemptId,
  testTitle,
  duration,
  questions,
}: TestInterfaceProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // Convert to seconds
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = (optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleQuestionJump = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleAutoSubmit = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/mock-tests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit test");
      }

      // Navigate to results page
      router.push(`/mock-tests/results/${attemptId}`);
    } catch (error) {
      console.error("Failed to submit test:", error);
      alert("Failed to submit test. Please try again.");
      setIsSubmitting(false);
    }
  }, [attemptId, answers, router, isSubmitting]);

  const handleSubmit = () => {
    setShowSubmitDialog(true);
  };

  const confirmSubmit = async () => {
    setShowSubmitDialog(false);
    await handleAutoSubmit();
  };

  const getTimeColor = () => {
    if (timeRemaining < 300) return "text-red-600"; // Less than 5 minutes
    if (timeRemaining < 600) return "text-yellow-600"; // Less than 10 minutes
    return "text-green-600";
  };

  return (
    <div className="space-y-6">
      {/* Header with timer and progress */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{testTitle}</h1>
          <p className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 text-lg font-mono font-bold ${getTimeColor()}`}>
            <Clock className="h-5 w-5" />
            {formatTime(timeRemaining)}
          </div>
          <Button onClick={handleSubmit} variant="default" disabled={isSubmitting}>
            <Flag className="h-4 w-4 mr-2" />
            Submit Test
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground text-right">
          {answeredCount} of {questions.length} answered
        </p>
      </div>

      {/* Question card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">
              Question {currentQuestionIndex + 1}
            </CardTitle>
            <Badge variant="secondary">{currentQuestion.marks} marks</Badge>
          </div>
          <CardDescription className="text-base text-foreground mt-4">
            {currentQuestion.question}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = answers[currentQuestion.id] === index;
            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-accent"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground"
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1">{option}</span>
                </div>
              </button>
            );
          })}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentQuestionIndex === questions.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>

      {/* Question navigator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question Navigator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((q, index) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = index === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => handleQuestionJump(index)}
                  className={`aspect-square rounded-md text-sm font-medium transition-all ${
                    isCurrent
                      ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                      : isAnswered
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted" />
              <span>Not Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary" />
              <span>Current</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit confirmation dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Test?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {questions.length} questions.
              {answeredCount < questions.length && (
                <span className="block mt-2 text-yellow-600">
                  Warning: You have {questions.length - answeredCount} unanswered questions.
                </span>
              )}
              <span className="block mt-2">
                Are you sure you want to submit? You cannot change your answers after submission.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Answers</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>
              Submit Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
