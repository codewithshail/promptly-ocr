"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  X,
  Save,
  ArrowLeft,
  Trash2,
  GripVertical,
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface MockTest {
  id: string;
  title: string;
  description: string;
  duration: number;
  totalQuestions: number;
  syllabus: string[];
  questions: Question[];
}

interface MockTestFormProps {
  test?: MockTest | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function MockTestForm({ test, onClose, onSuccess }: MockTestFormProps) {
  const [title, setTitle] = useState(test?.title || "");
  const [description, setDescription] = useState(test?.description || "");
  const [duration, setDuration] = useState(test?.duration || 120);
  const [syllabus, setSyllabus] = useState<string[]>(test?.syllabus || []);
  const [syllabusInput, setSyllabusInput] = useState("");
  const [questions, setQuestions] = useState<Question[]>(
    test?.questions || []
  );
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  function addSyllabusTopic() {
    if (syllabusInput.trim()) {
      setSyllabus([...syllabus, syllabusInput.trim()]);
      setSyllabusInput("");
    }
  }

  function removeSyllabusTopic(index: number) {
    setSyllabus(syllabus.filter((_, i) => i !== index));
  }

  function addQuestion() {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
    };
    setQuestions([...questions, newQuestion]);
  }

  function updateQuestion(index: number, updates: Partial<Question>) {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    setQuestions(updated);
  }

  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuestions(updated);
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a test title",
        variant: "destructive",
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one question",
        variant: "destructive",
      });
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        toast({
          title: "Error",
          description: `Question ${i + 1} is empty`,
          variant: "destructive",
        });
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        toast({
          title: "Error",
          description: `Question ${i + 1} has empty options`,
          variant: "destructive",
        });
        return;
      }
    }

    setSaving(true);

    try {
      const payload = {
        title,
        description,
        duration,
        totalQuestions: questions.length,
        syllabus,
        questions,
      };

      const url = test
        ? `/api/admin/mock-tests?id=${test.id}`
        : "/api/admin/mock-tests";
      const method = test ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: test
            ? "Mock test updated successfully"
            : "Mock test created successfully",
        });
        onSuccess();
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save mock test",
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
          {saving ? "Saving..." : test ? "Update Test" : "Create Test"}
        </Button>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Test Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., UPSC Prelims Mock Test 1"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the test"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="duration">Duration (minutes) *</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              min={1}
              required
            />
          </div>

          <div>
            <Label>Syllabus Topics</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={syllabusInput}
                onChange={(e) => setSyllabusInput(e.target.value)}
                placeholder="Add topic (e.g., Indian Polity)"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSyllabusTopic())}
              />
              <Button type="button" onClick={addSyllabusTopic}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {syllabus.map((topic, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {topic}
                  <button
                    type="button"
                    onClick={() => removeSyllabusTopic(index)}
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

      {/* Questions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Questions ({questions.length})</CardTitle>
          <Button type="button" onClick={addQuestion} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No questions added yet. Click "Add Question" to start.
            </div>
          ) : (
            questions.map((question, qIndex) => (
              <Card key={question.id} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-5 w-5 text-slate-400" />
                      <span className="font-semibold">Question {qIndex + 1}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(qIndex)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Question Text *</Label>
                    <Textarea
                      value={question.question}
                      onChange={(e) =>
                        updateQuestion(qIndex, { question: e.target.value })
                      }
                      placeholder="Enter the question"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label>Options *</Label>
                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex gap-2 items-center">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={question.correctAnswer === oIndex}
                            onChange={() =>
                              updateQuestion(qIndex, { correctAnswer: oIndex })
                            }
                            className="mt-1"
                          />
                          <Input
                            value={option}
                            onChange={(e) =>
                              updateOption(qIndex, oIndex, e.target.value)
                            }
                            placeholder={`Option ${oIndex + 1}`}
                            required
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Select the radio button for the correct answer
                    </p>
                  </div>

                  <div>
                    <Label>Explanation (Optional)</Label>
                    <Textarea
                      value={question.explanation || ""}
                      onChange={(e) =>
                        updateQuestion(qIndex, { explanation: e.target.value })
                      }
                      placeholder="Explain the correct answer"
                      rows={2}
                    />
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
