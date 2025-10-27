"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, BookTemplate } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TemplateForm } from "@/components/template-form";

interface AnswerTemplate {
  id: string;
  questionType: string;
  title: string;
  structure: string;
  sampleAnswer: string;
  annotations: Array<{
    section: string;
    explanation: string;
    keywords: string[];
  }>;
  createdAt: string;
}

export function AdminTemplatesClient() {
  const [templates, setTemplates] = useState<AnswerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AnswerTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<AnswerTemplate | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const response = await fetch("/api/admin/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(templateId: string) {
    try {
      const response = await fetch(`/api/admin/templates?id=${templateId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Template deleted successfully",
        });
        fetchTemplates();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    } finally {
      setDeletingTemplate(null);
    }
  }

  function handleEdit(template: AnswerTemplate) {
    setEditingTemplate(template);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingTemplate(null);
    fetchTemplates();
  }

  if (loading) {
    return null;
  }

  if (showForm) {
    return (
      <TemplateForm
        template={editingTemplate}
        onClose={handleFormClose}
        onSuccess={handleFormClose}
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create New Template
        </Button>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookTemplate className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No templates yet
              </h3>
              <p className="text-slate-600 mb-4">
                Create your first answer template to help students
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{template.questionType}</Badge>
                      </div>
                      <CardTitle className="text-xl mb-2">
                        {template.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">
                      Structure:
                    </h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">
                      {template.structure.substring(0, 200)}
                      {template.structure.length > 200 && "..."}
                    </p>
                  </div>

                  {template.annotations && template.annotations.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">
                        Key Elements:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {template.annotations.map((annotation, index) => (
                          <Badge key={index} variant="secondary">
                            {annotation.section}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingTemplate(template)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`/templates?preview=${template.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deletingTemplate}
        onOpenChange={() => setDeletingTemplate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTemplate?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingTemplate && handleDelete(deletingTemplate.id)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
