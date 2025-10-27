"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2, ArrowRight, RotateCcw } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface RevisionQuizProps {
  topic: string;
  subject: string;
  revisionId: string;
  onComplete: (difficulty: "easy" | "medium" | "hard") => void;
}

export function RevisionQuiz({ topic, subject, revisionId, onComplete }: RevisionQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    generateQuiz();
  }, [topic, subject]);

  const generateQuiz = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/revision/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, subject }),
      });

      if (!response.ok) throw new Error("Failed to generate quiz");

      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast({
        title: "Error",
        description: "Failed to generate quiz questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showFeedback) {
      setSelectedAnswer(answerIndex);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === questions[currentQuestionIndex].correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
    }

    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // Quiz completed
      setQuizCompleted(true);
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);
    setQuizCompleted(false);
    generateQuiz();
  };

  const calculateDifficulty = (): "easy" | "medium" | "hard" => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 80) return "easy";
    if (percentage >= 50) return "medium";
    return "hard";
  };

  const handleMarkAsRevised = () => {
    const difficulty = calculateDifficulty();
    onComplete(difficulty);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Generating quiz questions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Unable to generate quiz questions for this topic.
            </p>
            <Button onClick={generateQuiz} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (quizCompleted) {
    const percentage = (score / questions.length) * 100;
    const difficulty = calculateDifficulty();

    return (
      <Card>
        <CardHeader>
          <CardTitle>Quiz Completed!</CardTitle>
          <CardDescription>
            You scored {score} out of {questions.length} ({percentage.toFixed(0)}%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            {percentage >= 80 ? (
              <div className="space-y-2">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                <p className="text-lg font-semibold">Excellent work!</p>
                <p className="text-sm text-muted-foreground">
                  You have a strong grasp of this topic.
                </p>
              </div>
            ) : percentage >= 50 ? (
              <div className="space-y-2">
                <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
                  <span className="text-3xl">👍</span>
                </div>
                <p className="text-lg font-semibold">Good effort!</p>
                <p className="text-sm text-muted-foreground">
                  You're making progress. Keep practicing!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                  <span className="text-3xl">📚</span>
                </div>
                <p className="text-lg font-semibold">Keep learning!</p>
                <p className="text-sm text-muted-foreground">
                  This topic needs more attention. Don't give up!
                </p>
              </div>
            )}

            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-2">
                Based on your performance, this topic will be marked as:
              </p>
              <Badge
                variant={
                  difficulty === "easy"
                    ? "default"
                    : difficulty === "medium"
                    ? "secondary"
                    : "destructive"
                }
                className="text-lg px-4 py-1"
              >
                {difficulty.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleRetry} variant="outline" className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry Quiz
            </Button>
            <Button onClick={handleMarkAsRevised} className="flex-1">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark as Revised
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{topic}</CardTitle>
            <CardDescription>{subject}</CardDescription>
          </div>
          <Badge variant="outline">
            Question {currentQuestionIndex + 1} of {questions.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <p className="text-lg font-medium">{currentQuestion.question}</p>

          <RadioGroup
            value={selectedAnswer?.toString()}
            onValueChange={(value: string) => handleAnswerSelect(parseInt(value))}
            disabled={showFeedback}
          >
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 rounded-lg border p-4 ${
                  showFeedback
                    ? index === currentQuestion.correctAnswer
                      ? "border-green-500 bg-green-50"
                      : index === selectedAnswer
                      ? "border-red-500 bg-red-50"
                      : ""
                    : selectedAnswer === index
                    ? "border-primary bg-primary/5"
                    : ""
                }`}
              >
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label
                  htmlFor={`option-${index}`}
                  className="flex-1 cursor-pointer font-normal"
                >
                  {option}
                </Label>
                {showFeedback && index === currentQuestion.correctAnswer && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                {showFeedback && index === selectedAnswer && index !== currentQuestion.correctAnswer && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            ))}
          </RadioGroup>
        </div>

        {showFeedback && (
          <div
            className={`rounded-lg p-4 ${
              isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
            }`}
          >
            <p className="font-semibold mb-2">
              {isCorrect ? "Correct! ✓" : "Incorrect ✗"}
            </p>
            <p className="text-sm">{currentQuestion.explanation}</p>
          </div>
        )}

        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-muted-foreground">
            Score: {score}/{currentQuestionIndex + (showFeedback ? 1 : 0)}
          </div>
          {!showFeedback ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
            >
              Submit Answer
            </Button>
          ) : (
            <Button onClick={handleNextQuestion}>
              {currentQuestionIndex < questions.length - 1 ? (
                <>
                  Next Question
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                "View Results"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
