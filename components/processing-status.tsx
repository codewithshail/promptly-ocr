"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  Brain, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

type ProcessingStatus = "uploading" | "processing" | "completed" | "failed";

interface ProcessingStatusProps {
  status: ProcessingStatus;
  fileName?: string;
  copyType?: "gs" | "essay";
  errorMessage?: string;
  createdAt?: Date;
}

interface StatusStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const PROCESSING_STEPS: StatusStep[] = [
  {
    id: "uploading",
    label: "Uploading",
    icon: <Upload className="w-5 h-5" />,
    description: "Uploading your file to secure storage",
  },
  {
    id: "extracting",
    label: "Extracting Text",
    icon: <FileText className="w-5 h-5" />,
    description: "Using OCR to extract text from your copy",
  },
  {
    id: "evaluating",
    label: "Evaluating",
    icon: <Brain className="w-5 h-5" />,
    description: "AI is analyzing and evaluating your answer",
  },
  {
    id: "completed",
    label: "Completed",
    icon: <CheckCircle2 className="w-5 h-5" />,
    description: "Evaluation complete! Results are ready",
  },
];

export function ProcessingStatus({
  status,
  fileName,
  copyType,
  errorMessage,
  createdAt,
}: ProcessingStatusProps) {
  const getStatusInfo = () => {
    switch (status) {
      case "uploading":
        return {
          currentStep: 0,
          progress: 25,
          color: "blue",
          message: "Uploading your file...",
        };
      case "processing":
        return {
          currentStep: 2,
          progress: 65,
          color: "blue",
          message: "Processing and evaluating...",
        };
      case "completed":
        return {
          currentStep: 3,
          progress: 100,
          color: "green",
          message: "Evaluation completed successfully!",
        };
      case "failed":
        return {
          currentStep: -1,
          progress: 0,
          color: "red",
          message: "Processing failed",
        };
      default:
        return {
          currentStep: 0,
          progress: 0,
          color: "gray",
          message: "Unknown status",
        };
    }
  };

  const statusInfo = getStatusInfo();

  const getStepStatus = (stepIndex: number) => {
    if (status === "failed") return "error";
    if (stepIndex < statusInfo.currentStep) return "completed";
    if (stepIndex === statusInfo.currentStep) return "active";
    return "pending";
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <Card className={cn(
      "transition-all",
      status === "failed" && "border-red-200 dark:border-red-900",
      status === "completed" && "border-green-200 dark:border-green-900"
    )}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {status === "failed" ? (
                <XCircle className="w-5 h-5 text-red-600" />
              ) : status === "completed" ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              )}
              {statusInfo.message}
            </CardTitle>
            {fileName && (
              <CardDescription className="mt-2">
                {fileName}
                {copyType && (
                  <Badge variant="outline" className="ml-2">
                    {copyType === "gs" ? "General Studies" : "Essay"}
                  </Badge>
                )}
              </CardDescription>
            )}
          </div>
          {createdAt && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {formatTimestamp(createdAt)}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        {status !== "failed" && (
          <div className="space-y-2">
            <Progress 
              value={statusInfo.progress} 
              className={cn(
                "h-2",
                status === "completed" && "[&>div]:bg-green-500"
              )}
            />
            <p className="text-xs text-muted-foreground text-right">
              {statusInfo.progress}% complete
            </p>
          </div>
        )}

        {/* Error Message */}
        {status === "failed" && errorMessage && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
            <div className="flex gap-3">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100 text-sm mb-1">
                  Processing Error
                </p>
                <p className="text-red-800 dark:text-red-200 text-sm">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Processing Steps */}
        <div className="space-y-4">
          {PROCESSING_STEPS.map((step, index) => {
            const stepStatus = getStepStatus(index);
            
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-4 transition-all",
                  stepStatus === "pending" && "opacity-40",
                  stepStatus === "error" && "opacity-60"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 transition-all",
                    stepStatus === "completed" && "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
                    stepStatus === "active" && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                    stepStatus === "pending" && "bg-gray-100 dark:bg-gray-800 text-gray-400",
                    stepStatus === "error" && "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  )}
                >
                  {stepStatus === "active" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{step.label}</h4>
                    {stepStatus === "completed" && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                    {stepStatus === "active" && (
                      <Badge variant="secondary" className="text-xs">
                        In Progress
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Estimated Time and Email Notification */}
        {(status === "processing" || status === "uploading") && (
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <Clock className="w-4 h-4 inline mr-2" />
                Estimated time remaining: {status === "uploading" ? "2-3 minutes" : "1-2 minutes"}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
              <p className="text-sm text-purple-900 dark:text-purple-100">
                📧 You'll receive an email notification when your evaluation is complete. Feel free to close this page.
              </p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {status === "completed" && (
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
              <p className="text-sm text-green-900 dark:text-green-100">
                <CheckCircle2 className="w-4 h-4 inline mr-2" />
                Your evaluation is ready! Scroll down to view the detailed results.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
              <p className="text-sm text-purple-900 dark:text-purple-100">
                📧 An email with your evaluation summary has been sent to your inbox.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
