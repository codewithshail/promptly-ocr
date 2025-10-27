"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  FileQuestion,
  Users,
} from "lucide-react";
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
import { MockTestForm } from "@/components/mock-test-form";

interface MockTest {
  id: string;
  title: string;
  description: string;
  duration: number;
  totalQuestions: number;
  syllabus: string[];
  questions: any[];
  createdAt: string;
  _count?: {
    attempts: number;
  };
}

export function AdminMockTestsClient() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState<MockTest | null>(null);
  const [deletingTest, setDeletingTest] = useState<MockTest | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTests();
  }, []);

  async function fetchTests() {
    try {
      const response = await fetch("/api/admin/mock-tests");
      if (response.ok) {
        const data = await response.json();
        setTests(data.tests);
      }
    } catch (error) {
      console.error("Error fetching tests:", error);
      toast({
        title: "Error",
        description: "Failed to load mock tests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(testId: string) {
    try {
      const response = await fetch(`/api/admin/mock-tests?id=${testId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Mock test deleted successfully",
        });
        fetchTests();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete mock test",
        variant: "destructive",
      });
    } finally {
      setDeletingTest(null);
    }
  }

  function handleEdit(test: MockTest) {
    setEditingTest(test);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingTest(null);
    fetchTests();
  }

  if (loading) {
    return null;
  }

  if (showForm) {
    return (
      <MockTestForm
        test={editingTest}
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
          Create New Test
        </Button>

        {tests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileQuestion className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No mock tests yet
              </h3>
              <p className="text-slate-600 mb-4">
                Create your first mock test to get started
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Mock Test
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tests.map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {test.title}
                      </CardTitle>
                      <p className="text-sm text-slate-600">
                        {test.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="h-4 w-4" />
                      <span>{test.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <FileQuestion className="h-4 w-4" />
                      <span>{test.totalQuestions} questions</span>
                    </div>
                    {test._count && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="h-4 w-4" />
                        <span>{test._count.attempts} attempts</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {test.syllabus.map((topic, index) => (
                      <Badge key={index} variant="secondary">
                        {topic}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(test)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingTest(test)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`/mock-tests?preview=${test.id}`}
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
        open={!!deletingTest}
        onOpenChange={() => setDeletingTest(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mock Test</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTest?.title}"? This
              action cannot be undone and will also delete all user attempts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTest && handleDelete(deletingTest.id)}
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
