"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

interface TemplateCardProps {
  id: string;
  title: string;
  questionType: string;
  description: string;
  onClick: () => void;
}

export function TemplateCard({ title, questionType, description, onClick }: TemplateCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center shrink-0">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <Badge variant="secondary" className="text-xs">
            {questionType}
          </Badge>
        </div>
        <CardTitle className="text-lg break-words">{title}</CardTitle>
        <CardDescription className="text-sm break-words line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Click to view template →</p>
      </CardContent>
    </Card>
  );
}
