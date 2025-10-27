import { useCallback } from "react";
import { useUser } from "@clerk/nextjs";

export type ActivityType =
  | "chat_message"
  | "copy_upload"
  | "news_read"
  | "quiz_taken"
  | "test_completed";

/**
 * Hook for tracking user activities
 * Automatically tracks activities and updates streak
 */
export function useActivityTracker() {
  const { user } = useUser();

  const trackActivity = useCallback(
    async (
      activityType: ActivityType,
      activityData?: Record<string, unknown>
    ) => {
      if (!user) {
        console.warn("Cannot track activity: user not authenticated");
        return;
      }

      try {
        const response = await fetch("/api/activities/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activityType,
            activityData,
          }),
        });

        if (!response.ok) {
          console.error("Failed to track activity:", await response.text());
        }
      } catch (error) {
        console.error("Error tracking activity:", error);
        // Don't throw to avoid breaking main flow
      }
    },
    [user]
  );

  return { trackActivity };
}
