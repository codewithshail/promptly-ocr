"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, ArrowRight, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizInterfaceProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

export function QuizInterface({ questions, onComplete }: QuizInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const { toast } = useToast();

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showFeedback) {
      setSelectedAnswer(answerIndex);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) {
      toast({
        title: "Please select an answer",
        description: "Choose one of the options before submitting",
        variant: "destructive",
      });
      return;
    }

    setShowFeedback(true);
    setAnswers([...answers, selectedAnswer]);

    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // Quiz complete
      handleQuizComplete();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  const handleQuizComplete = async () => {
    const finalScore = selectedAnswer === currentQuestion.correctAnswer ? score + 1 : score;
    
    try {
      // Submit quiz results to backend
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: [...answers, selectedAnswer],
          score: finalScore,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit quiz");
      }

      onComplete(finalScore);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast({
        title: "Error",
        description: "Failed to save quiz results. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>Score: {score}/{questions.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl leading-relaxed">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Options */}
          <RadioGroup
            value={selectedAnswer?.toString()}
            onValueChange={(value) => handleAnswerSelect(parseInt(value))}
            disabled={showFeedback}
          >
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectOption = index === currentQuestion.correctAnswer;
                
                let borderColor = "border-border";
                let bgColor = "";
                
                if (showFeedback) {
                  if (isCorrectOption) {
                    borderColor = "border-green-500";
                    bgColor = "bg-green-50 dark:bg-green-950/20";
                  } else if (isSelected && !isCorrect) {
                    borderColor = "border-red-500";
                    bgColor = "bg-red-50 dark:bg-red-950/20";
                  }
                }

                return (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${borderColor} ${bgColor} ${
                      !showFeedback && isSelected ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer text-base leading-relaxed"
                    >
                      {option}
                    </Label>
                    {showFeedback && isCorrectOption && (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    )}
                    {showFeedback && isSelected && !isCorrect && (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </RadioGroup>

          {/* Feedback */}
          {showFeedback && (
            <div className={`p-4 rounded-lg ${
              isCorrect 
                ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900" 
                : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900"
            }`}>
              <div className="flex items-start gap-3">
                {isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="space-y-2">
                  <p className={`font-semibold ${isCorrect ? "text-green-900 dark:text-green-100" : "text-red-900 dark:text-red-100"}`}>
                    {isCorrect ? "Correct!" : "Incorrect"}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            {!showFeedback ? (
              <Button onClick={handleSubmitAnswer} size="lg">
                Submit Answer
              </Button>
            ) : (
              <Button onClick={handleNextQuestion} size="lg">
                {isLastQuestion ? (
                  <>
                    <Trophy className="h-4 w-4 mr-2" />
                    View Results
                  </>
                ) : (
                  <>
                    Next Question
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
