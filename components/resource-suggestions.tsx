"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  FileText,
  BookOpen,
  ExternalLink,
  Target,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ResourceSuggestionsProps {
  subject: string;
}

interface ResourceData {
  tips: Array<{ id: string; subject: string; content: string }>;
  templates: Array<{ id: string; title: string; questionType: string }>;
  mockTests: Array<{ id: string; title: string; syllabus: string[] }>;
  externalResources: Array<{ title: string; url: string; type: string }>;
}

export function ResourceSuggestions({ subject }: ResourceSuggestionsProps) {
  const router = useRouter();
  const [resources, setResources] = useState<ResourceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await fetch(
          `/api/analytics/weak-areas/resources?subject=${encodeURIComponent(subject)}`
        );
        if (response.ok) {
          const data = await response.json();
          setResources(data);
        }
      } catch (error) {
        console.error("Failed to fetch resources:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [subject]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recommended Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading resources...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!resources) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Tips Section */}
      {resources.tips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Relevant Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resources.tips.map((tip) => (
              <div
                key={tip.id}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{tip.subject}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {typeof tip.content === "string"
                        ? tip.content
                        : JSON.stringify(tip.content).substring(0, 100)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      router.push(`/tips?subject=${encodeURIComponent(tip.subject)}`)
                    }
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/tips?subject=${encodeURIComponent(subject)}`)}
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              View All Tips for {subject}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Templates Section */}
      {resources.templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Answer Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resources.templates.map((template) => (
              <div
                key={template.id}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium">{template.title}</h4>
                    <Badge variant="secondary" className="mt-1">
                      {template.questionType}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push("/templates")}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/templates")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Browse All Templates
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Mock Tests Section */}
      {resources.mockTests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Practice Tests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resources.mockTests.map((test) => (
              <div
                key={test.id}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium">{test.title}</h4>
                    {test.syllabus.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {test.syllabus.slice(0, 2).join(", ")}
                        {test.syllabus.length > 2 && "..."}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push("/mock-tests")}
                  >
                    Start
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/mock-tests")}
            >
              <Target className="h-4 w-4 mr-2" />
              View All Mock Tests
            </Button>
          </CardContent>
        </Card>
      )}

      {/* External Resources Section */}
      {resources.externalResources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-500" />
              External Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resources.externalResources.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium flex items-center gap-2">
                      {resource.title}
                      <ExternalLink className="h-3 w-3" />
                    </h4>
                    <Badge variant="outline" className="mt-1">
                      {resource.type}
                    </Badge>
                  </div>
                </div>
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
