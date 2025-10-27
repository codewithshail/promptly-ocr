import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { Card } from "./card";
import { Alert, AlertDescription, AlertTitle } from "./alert";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: "card" | "alert" | "inline";
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  variant = "card",
  className,
}: ErrorStateProps) {
  if (variant === "alert") {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{message}</span>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex-shrink-0"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              {retryLabel}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-3 text-destructive ${className || ""}`}>
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3 w-3 mr-2" />
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }

  // Default: card variant
  return (
    <Card className={`p-12 text-center ${className || ""}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-md">{message}</p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            {retryLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}
