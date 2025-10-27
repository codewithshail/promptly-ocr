"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Save, ArrowLeft, Trash2 } from "lucide-react";

interface Annotation {
  section: string;
  explanation: string;
  keywords: string[];
}

interface AnswerTemplate {
  id: string;
  questionType: string;
  title: string;
  structure: string;
  sampleAnswer: string;
  annotations: Annotation[];
}

interface TemplateFormProps {
  template?: AnswerTemplate | null;
  onClose: () => void;
  onSuccess: () => void;
}

const QUESTION_TYPES = [
  "Analytical",
  "Descriptive",
  "Comparative",
  "Case Study",
  "Opinion Based",
  "Factual",
  "Problem Solving",
  "Essay",
];

export function TemplateForm({
  template,
  onClose,
  onSuccess,
}: TemplateFormProps) {
  const [questionType, setQuestionType] = useState(
    template?.questionType || ""
  );
  const [title, setTitle] = useState(template?.title || "");
  const [structure, setStructure] = useState(template?.structure || "");
  const [sampleAnswer, setSampleAnswer] = useState(
    template?.sampleAnswer || ""
  );
  const [annotations, setAnnotations] = useState<Annotation[]>(
    template?.annotations || []
  );
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  function addAnnotation() {
    setAnnotations([
      ...annotations,
      { section: "", explanation: "", keywords: [] },
    ]);
  }

  function updateAnnotation(index: number, updates: Partial<Annotation>) {
    const updated = [...annotations];
    updated[index] = { ...updated[index], ...updates };
    setAnnotations(updated);
  }

  function removeAnnotation(index: number) {
    setAnnotations(annotations.filter((_, i) => i !== index));
  }

  function addKeyword(annotationIndex: number, keyword: string) {
    if (keyword.trim()) {
      const updated = [...annotations];
      updated[annotationIndex].keywords.push(keyword.trim());
      setAnnotations(updated);
    }
  }

  function removeKeyword(annotationIndex: number, keywordIndex: number) {
    const updated = [...annotations];
    updated[annotationIndex].keywords = updated[
      annotationIndex
    ].keywords.filter((_, i) => i !== keywordIndex);
    setAnnotations(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!questionType || !title.trim() || !structure.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        questionType,
        title,
        structure,
        sampleAnswer,
        annotations,
      };

      const url = template
        ? `/api/admin/templates?id=${template.id}`
        : "/api/admin/templates";
      const method = template ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: template
            ? "Template updated successfully"
            : "Template created successfully",
        });
        onSuccess();
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving
            ? "Saving..."
            : template
            ? "Update Template"
            : "Create Template"}
        </Button>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="questionType">Question Type *</Label>
            <select
              id="questionType"
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Select a type</option>
              {QUESTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., How to write an analytical answer"
              required
            />
          </div>

          <div>
            <Label htmlFor="structure">Answer Structure *</Label>
            <Textarea
              id="structure"
              value={structure}
              onChange={(e) => setStructure(e.target.value)}
              placeholder="Describe the structure of the answer (Introduction, Body, Conclusion, etc.)"
              rows={6}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Explain how to structure this type of answer
            </p>
          </div>

          <div>
            <Label htmlFor="sampleAnswer">Sample Answer</Label>
            <Textarea
              id="sampleAnswer"
              value={sampleAnswer}
              onChange={(e) => setSampleAnswer(e.target.value)}
              placeholder="Provide a complete sample answer demonstrating the structure"
              rows={10}
            />
            <p className="text-xs text-slate-500 mt-1">
              Optional: Provide a full example answer
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Annotations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Key Elements & Annotations</CardTitle>
          <Button type="button" onClick={addAnnotation} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Element
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {annotations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No annotations added. Click "Add Element" to highlight key parts
              of the answer structure.
            </div>
          ) : (
            annotations.map((annotation, index) => (
              <Card key={index} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Element {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAnnotation(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Section Name</Label>
                    <Input
                      value={annotation.section}
                      onChange={(e) =>
                        updateAnnotation(index, { section: e.target.value })
                      }
                      placeholder="e.g., Introduction, Main Argument, etc."
                    />
                  </div>

                  <div>
                    <Label>Explanation</Label>
                    <Textarea
                      value={annotation.explanation}
                      onChange={(e) =>
                        updateAnnotation(index, {
                          explanation: e.target.value,
                        })
                      }
                      placeholder="Explain what should be included in this section"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Keywords</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Add keyword"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addKeyword(
                              index,
                              (e.target as HTMLInputElement).value
                            );
                            (e.target as HTMLInputElement).value = "";
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {annotation.keywords.map((keyword, kIndex) => (
                        <Badge key={kIndex} variant="secondary">
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeKeyword(index, kIndex)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </form>
  );
}
