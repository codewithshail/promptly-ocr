"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Sparkles,
  Maximize2,
  Minimize2,
  Lightbulb,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type AIAction =
  | "expand"
  | "summarize"
  | "add-examples"
  | "create-mnemonics"
  | "generate-questions"
  | "custom";

interface AIHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string;
  onApply: (enhancedContent: string) => void;
}

const AI_ACTIONS = [
  {
    id: "expand" as AIAction,
    label: "Expand Content",
    description: "Add more detail and context",
    icon: Maximize2,
  },
  {
    id: "summarize" as AIAction,
    label: "Summarize",
    description: "Create concise key points",
    icon: Minimize2,
  },
  {
    id: "add-examples" as AIAction,
    label: "Add Examples",
    description: "Include relevant examples",
    icon: Lightbulb,
  },
  {
    id: "create-mnemonics" as AIAction,
    label: "Create Mnemonics",
    description: "Memory aids for key points",
    icon: BookOpen,
  },
  {
    id: "generate-questions" as AIAction,
    label: "Generate Questions",
    description: "Practice questions with answers",
    icon: HelpCircle,
  },
];

export function AIHelpDialog({
  open,
  onOpenChange,
  noteId,
  onApply,
}: AIHelpDialogProps) {
  const [selectedAction, setSelectedAction] = useState<AIAction | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [enhancedContent, setEnhancedContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!selectedAction) {
      toast({
        title: "Action required",
        description: "Please select an AI action",
        variant: "destructive",
      });
      return;
    }

    if (selectedAction === "custom" && !customPrompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a custom prompt",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      setEnhancedContent("");

      const response = await fetch("/api/notes/ai-help", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noteId,
          action: selectedAction,
          customPrompt: selectedAction === "custom" ? customPrompt : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate AI content");
      }

      const data = await response.json();
      setEnhancedContent(data.enhancedContent);
    } catch (error) {
      console.error("Failed to generate AI content:", error);
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (enhancedContent) {
      onApply(enhancedContent);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedAction(null);
    setCustomPrompt("");
    setEnhancedContent("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Help
          </DialogTitle>
          <DialogDescription>
            Enhance your note with AI-powered suggestions
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Action Selection */}
          {!enhancedContent && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Select an action:</p>
              <div className="grid grid-cols-2 gap-2">
                {AI_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => setSelectedAction(action.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedAction === action.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{action.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Prompt */}
              {selectedAction === "custom" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Request</label>
                  <Textarea
                    placeholder="Describe what you want the AI to do with your note..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          {/* Enhanced Content Preview */}
          {enhancedContent && (
            <div className="flex-1 flex flex-col min-h-0">
              <p className="text-sm font-medium mb-2">Enhanced Content:</p>
              <ScrollArea className="flex-1 border rounded-lg p-4">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {enhancedContent}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">
                  AI is working on your note...
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!enhancedContent ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !selectedAction}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEnhancedContent("");
                  setSelectedAction(null);
                }}
              >
                Try Again
              </Button>
              <Button onClick={handleApply}>Apply to Note</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
