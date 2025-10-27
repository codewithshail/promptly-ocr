"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bookmark, BookmarkCheck, FileText, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TemplateDetailProps {
  template: {
    id: string;
    questionType: string;
    title: string;
    structure: string;
    sampleAnswer: string;
    annotations: string;
  };
  onBack: () => void;
}

interface Annotation {
  section: string;
  tip: string;
}

export function TemplateDetail({ template, onBack }: TemplateDetailProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const { toast } = useToast();

  const annotations: Annotation[] = template.annotations 
    ? JSON.parse(template.annotations) 
    : [];

  const handleBookmark = async () => {
    setIsBookmarking(true);
    try {
      const response = await fetch("/api/bookmarks/template", {
        method: isBookmarked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id }),
      });

      if (!response.ok) throw new Error("Failed to update bookmark");

      setIsBookmarked(!isBookmarked);
      toast({
        title: isBookmarked ? "Bookmark removed" : "Template bookmarked",
        description: isBookmarked 
          ? "Template removed from your bookmarks" 
          : "Template saved to your bookmarks",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBookmarking(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Templates
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{template.questionType}</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{template.title}</h1>
          </div>
          <Button
            variant={isBookmarked ? "default" : "outline"}
            size="icon"
            onClick={handleBookmark}
            disabled={isBookmarking}
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Structure */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Answer Structure</CardTitle>
          </div>
          <CardDescription>
            Follow this structure for consistent and well-organized answers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="font-mono text-sm whitespace-pre-wrap">{template.structure}</p>
          </div>
        </CardContent>
      </Card>

      {/* Key Elements with Annotations */}
      {annotations.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <CardTitle>Key Elements & Tips</CardTitle>
            </div>
            <CardDescription>
              Important points to remember for each section
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {annotations.map((annotation, index) => (
                <div
                  key={index}
                  className="border-l-4 border-primary pl-4 py-2"
                >
                  <h4 className="font-semibold text-sm mb-1">{annotation.section}</h4>
                  <p className="text-sm text-muted-foreground">{annotation.tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample Answer */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Answer</CardTitle>
          <CardDescription>
            Example demonstrating the template structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {template.sampleAnswer}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
