"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, XCircle, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSwipeable } from "react-swipeable";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  sourceType?: string;
  sourceId?: string;
}

interface FlashcardDeckProps {
  flashcards: Flashcard[];
  onReview: (flashcardId: string, difficulty: "easy" | "medium" | "hard") => Promise<void>;
  onComplete?: () => void;
}

export function FlashcardDeck({ flashcards, onReview, onComplete }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCards, setReviewedCards] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (!isFlipped) {
        handleNext();
      }
    },
    onSwipedRight: () => {
      if (!isFlipped) {
        handlePrevious();
      }
    },
    onSwipedUp: () => {
      if (!isFlipped) {
        handleFlip();
      }
    },
    trackMouse: false, // Only track touch, not mouse
    preventScrollOnSwipe: true,
  });

  if (flashcards.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">No flashcards available for review</p>
      </Card>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progress = ((reviewedCards.size) / flashcards.length) * 100;
  const isLastCard = currentIndex === flashcards.length - 1;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else if (reviewedCards.size === flashcards.length) {
      // All cards reviewed
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleReview = async (difficulty: "easy" | "medium" | "hard") => {
    try {
      await onReview(currentCard.id, difficulty);
      
      // Mark card as reviewed
      setReviewedCards(new Set([...reviewedCards, currentCard.id]));

      // Show feedback
      const messages = {
        easy: "Great! You'll see this card less frequently.",
        medium: "Good! This card will appear at regular intervals.",
        hard: "No worries! You'll review this card more often.",
      };

      toast({
        title: "Review Recorded",
        description: messages[difficulty],
      });

      // Move to next card after a short delay
      setTimeout(() => {
        handleNext();
      }, 500);
    } catch (error) {
      console.error("Error recording review:", error);
      toast({
        title: "Error",
        description: "Failed to record your review. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Card {currentIndex + 1} of {flashcards.length}</span>
          <span>Reviewed: {reviewedCards.size}/{flashcards.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <div className="relative" {...swipeHandlers}>
        <div
          className="perspective-1000 cursor-pointer touch-none"
          onClick={handleFlip}
        >
          <div
            className={`relative transition-transform duration-500 transform-style-3d ${
              isFlipped ? "rotate-y-180" : ""
            }`}
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front of card (Question) */}
            <Card
              className={`min-h-[400px] flex items-center justify-center p-8 backface-hidden ${
                isFlipped ? "hidden" : ""
              }`}
            >
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground uppercase tracking-wide">
                  Question
                </p>
                <p className="text-2xl font-medium leading-relaxed">
                  {currentCard.question}
                </p>
                <p className="text-sm text-muted-foreground mt-8">
                  Click to reveal answer
                </p>
              </CardContent>
            </Card>

            {/* Back of card (Answer) */}
            <Card
              className={`min-h-[400px] flex items-center justify-center p-8 backface-hidden ${
                !isFlipped ? "hidden" : ""
              }`}
              style={{
                transform: "rotateY(180deg)",
              }}
            >
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground uppercase tracking-wide">
                  Answer
                </p>
                <p className="text-xl leading-relaxed">
                  {currentCard.answer}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Flip indicator */}
        <div className="flex flex-col items-center gap-2 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFlip}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {isFlipped ? "Show Question" : "Show Answer"}
          </Button>
          <p className="text-xs text-muted-foreground md:hidden">
            Swipe up to flip • Swipe left/right to navigate
          </p>
        </div>
      </div>

      {/* Review Buttons (only show when answer is revealed) */}
      {isFlipped && !reviewedCards.has(currentCard.id) && (
        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            How well did you know this?
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="flex-col h-auto py-4 gap-2 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-950"
              onClick={() => handleReview("hard")}
            >
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="font-semibold">Hard</span>
              <span className="text-xs text-muted-foreground">Review soon</span>
            </Button>
            <Button
              variant="outline"
              className="flex-col h-auto py-4 gap-2 border-yellow-200 hover:bg-yellow-50 hover:border-yellow-300 dark:border-yellow-900 dark:hover:bg-yellow-950"
              onClick={() => handleReview("medium")}
            >
              <Minus className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold">Medium</span>
              <span className="text-xs text-muted-foreground">Normal pace</span>
            </Button>
            <Button
              variant="outline"
              className="flex-col h-auto py-4 gap-2 border-green-200 hover:bg-green-50 hover:border-green-300 dark:border-green-900 dark:hover:bg-green-950"
              onClick={() => handleReview("easy")}
            >
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-semibold">Easy</span>
              <span className="text-xs text-muted-foreground">Review later</span>
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={handleNext}
          disabled={isLastCard && reviewedCards.size < flashcards.length}
        >
          {isLastCard && reviewedCards.size === flashcards.length ? "Finish" : "Next"}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
