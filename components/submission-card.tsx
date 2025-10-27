"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

type CopyType = "gs" | "essay";
type SubmissionStatus = "pending" | "processing" | "completed" | "failed";

interface Submission {
  id: string;
  fileName: string;
  copyType: CopyType;
  status: SubmissionStatus;
  createdAt: string;
  evaluationResult?: {
    totalScore: number;
    maxScore: number;
  };
  errorMessage?: string;
}

interface SubmissionCardProps {
  submission: Submission;
  onRetry: () => void;
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    iconColor: "text-yellow-600 dark:text-yellow-400",
  },
  processing: {
    icon: Loader2,
    label: "Processing",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    iconColor: "text-green-600 dark:text-green-400",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    iconColor: "text-red-600 dark:text-red-400",
  },
};

export function SubmissionCard({ submission, onRetry }: SubmissionCardProps) {
  const router = useRouter();
  const config = statusConfig[submission.status];
  const StatusIcon = config.icon;

  const handleViewResults = () => {
    router.push(`/history?id=${submission.id}`);
  };

  const handleRetry = async () => {
    try {
      const response = await fetch(`/api/submissions/${submission.id}/retry`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to retry submission");
      }

      onRetry();
    } catch (error) {
      console.error("Error retrying submission:", error);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Icon and File Info */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{submission.fileName}</h3>
                <Badge
                  variant="secondary"
                  className="text-xs flex-shrink-0 uppercase"
                >
                  {submission.copyType}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Uploaded {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Badge className={`${config.color} flex items-center gap-1.5 px-3 py-1`}>
              <StatusIcon
                className={`h-3.5 w-3.5 ${
                  submission.status === "processing" ? "animate-spin" : ""
                }`}
              />
              {config.label}
            </Badge>
          </div>

          {/* Score or Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {submission.status === "completed" && submission.evaluationResult && (
              <>
                <div className="text-right mr-2">
                  <div className="text-2xl font-bold text-primary">
                    {submission.evaluationResult.totalScore}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    / {submission.evaluationResult.maxScore}
                  </div>
                </div>
                <Button onClick={handleViewResults} size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View Results
                </Button>
              </>
            )}

            {submission.status === "failed" && (
              <Button onClick={handleRetry} size="sm" variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}

            {(submission.status === "pending" || submission.status === "processing") && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Processing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {submission.status === "failed" && submission.errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">
                {submission.errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* Processing Progress Indicator */}
        {(submission.status === "pending" || submission.status === "processing") && (
          <div className="mt-4">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 animate-pulse"
                style={{
                  width: submission.status === "pending" ? "20%" : "60%",
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {submission.status === "pending"
                ? "Queued for processing..."
                : "Extracting text and evaluating..."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
