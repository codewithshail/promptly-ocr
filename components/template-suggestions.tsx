"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

interface TemplateSuggestion {
  id: string;
  title: string;
  questionType: string;
  relevance: string;
}

interface TemplateSuggestionsProps {
  copyType: "gs" | "essay";
  suggestions?: TemplateSuggestion[];
}

// Default suggestions based on copy type
const getDefaultSuggestions = (copyType: "gs" | "essay"): TemplateSuggestion[] => {
  if (copyType === "essay") {
    return [
      {
        id: "1",
        title: "Argumentative Essay Template",
        questionType: "Essay",
        relevance: "Helps structure balanced arguments with clear thesis"
      },
      {
        id: "2",
        title: "Analytical Essay Template",
        questionType: "Essay",
        relevance: "Provides framework for systematic analysis"
      }
    ];
  } else {
    return [
      {
        id: "3",
        title: "150-Word Answer Template",
        questionType: "General Studies",
        relevance: "Perfect for 10-mark questions with concise structure"
      },
      {
        id: "4",
        title: "250-Word Answer Template",
        questionType: "General Studies",
        relevance: "Ideal for 15-mark questions with detailed coverage"
      }
    ];
  }
};

export function TemplateSuggestions({ copyType, suggestions }: TemplateSuggestionsProps) {
  const displaySuggestions = suggestions || getDefaultSuggestions(copyType);

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Recommended Templates
        </CardTitle>
        <CardDescription>
          Structured templates to improve your answer writing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {displaySuggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="flex items-start justify-between gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-purple-100 dark:border-purple-900"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                <Badge variant="secondary" className="text-xs">
                  {suggestion.questionType}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{suggestion.relevance}</p>
            </div>
            <Link href={`/templates?highlight=${suggestion.id}`}>
              <Button size="sm" variant="ghost" className="shrink-0">
                View
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        ))}
        
        <div className="pt-2">
          <Link href="/templates">
            <Button variant="outline" className="w-full">
              Browse All Templates
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
