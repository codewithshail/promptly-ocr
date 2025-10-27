import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export interface UserPreferences {
  newsCategories: string[];
  thinkingModeDefault: boolean;
  notificationSettings: Record<string, boolean>;
  dailyStreak: number;
  lastActivityDate: string | null;
}

export function usePreferences() {
  const { user, isLoaded } = useUser();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) {
      setIsLoading(false);
      return;
    }

    fetchPreferences();
  }, [isLoaded, user]);

  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/preferences");

      if (!response.ok) {
        throw new Error("Failed to fetch preferences");
      }

      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      console.error("Error fetching preferences:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (
    updates: Partial<UserPreferences>
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      const data = await response.json();
      setPreferences(data);
      return true;
    } catch (err) {
      console.error("Error updating preferences:", err);
      return false;
    }
  };

  const refreshPreferences = () => {
    fetchPreferences();
  };

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    refreshPreferences,
  };
}
