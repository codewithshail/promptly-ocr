"use client";

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

interface PreferenceBannerProps {
  onDismiss?: () => void;
}

export function PreferenceBanner({ onDismiss }: PreferenceBannerProps) {
  const router = useRouter();

  const handleGoToSettings = () => {
    router.push("/profile");
  };

  return (
    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <span className="text-blue-900 dark:text-blue-100">
          Set your news preferences to personalize your feed and see articles from your preferred categories first.
        </span>
        <Button
          onClick={handleGoToSettings}
          variant="default"
          size="sm"
          className="shrink-0"
        >
          Go to Settings
        </Button>
      </AlertDescription>
    </Alert>
  );
}
