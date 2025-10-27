"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Plus } from "lucide-react";

interface FlashcardPair {
  question: string;
  answer: string;
}

interface FlashcardCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string;
  articleTitle: string;
  articleContent: string;
  onSuccess?: () => void;
}

export function FlashcardCreator({
  open,
  onOpenChange,
  articleId,
  articleTitle,
  articleContent,
  onSuccess,
}: FlashcardCreatorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [flashcards, setFlashcards] = useState<FlashcardPair[]>([]);
  const { toast } = useToast();

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      
      const response = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          articleTitle,
          articleContent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate flashcards");
      }

      const data = await response.json();
      setFlashcards(data.flashcards || []);

      if (data.flashcards.length === 0) {
        toast({
          title: "No Flashcards Generated",
          description: "Could not generate flashcards from this article. Try another one.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast({
        title: "Error",
        description: "Failed to generate flashcards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (flashcards.length === 0) {
      toast({
        title: "No Flashcards",
        description: "Generate flashcards first before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flashcards: flashcards.map((fc) => ({
            question: fc.question,
            answer: fc.answer,
            sourceType: "news",
            sourceId: articleId,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save flashcards");
      }

      toast({
        title: "Success",
        description: `${flashcards.length} flashcard${flashcards.length !== 1 ? "s" : ""} created successfully!`,
      });

      onOpenChange(false);
      setFlashcards([]);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving flashcards:", error);
      toast({
        title: "Error",
        description: "Failed to save flashcards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateFlashcard = (index: number, field: "question" | "answer", value: string) => {
    const updated = [...flashcards];
    updated[index][field] = value;
    setFlashcards(updated);
  };

  const removeFlashcard = (index: number) => {
    setFlashcards(flashcards.filter((_, i) => i !== index));
  };

  const addFlashcard = () => {
    setFlashcards([...flashcards, { question: "", answer: "" }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Flashcards</DialogTitle>
          <DialogDescription>
            Generate flashcards from this article or create your own
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Article Info */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium text-sm mb-1">Article:</p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {articleTitle}
            </p>
          </div>

          {/* Generate Button */}
          {flashcards.length === 0 && (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Flashcards...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Flashcards with AI
                </>
              )}
            </Button>
          )}

          {/* Flashcard List */}
          {flashcards.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {flashcards.length} Flashcard{flashcards.length !== 1 ? "s" : ""}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addFlashcard}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add More
                </Button>
              </div>

              {flashcards.map((flashcard, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Flashcard {index + 1}
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFlashcard(index)}
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`question-${index}`}>Question</Label>
                    <Textarea
                      id={`question-${index}`}
                      value={flashcard.question}
                      onChange={(e) => updateFlashcard(index, "question", e.target.value)}
                      placeholder="Enter the question..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`answer-${index}`}>Answer</Label>
                    <Textarea
                      id={`answer-${index}`}
                      value={flashcard.answer}
                      onChange={(e) => updateFlashcard(index, "answer", e.target.value)}
                      placeholder="Enter the answer..."
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          {flashcards.length > 0 && (
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFlashcards([]);
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || flashcards.some((fc) => !fc.question || !fc.answer)}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  `Save ${flashcards.length} Flashcard${flashcards.length !== 1 ? "s" : ""}`
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
