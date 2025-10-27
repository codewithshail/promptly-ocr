"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailPreferencesProps {
  preferences: {
    emailWelcome: boolean;
    emailCopyComplete: boolean;
    emailDailyDigest: boolean;
    emailAnnouncements: boolean;
  };
  onUpdate?: (preferences: EmailPreferencesProps["preferences"]) => void;
}

export function EmailPreferences({ preferences, onUpdate }: EmailPreferencesProps) {
  const { toast } = useToast();
  const [emailPrefs, setEmailPrefs] = useState(preferences);
  const [isSaving, setIsSaving] = useState(false);

  const allDisabled =
    !emailPrefs.emailWelcome &&
    !emailPrefs.emailCopyComplete &&
    !emailPrefs.emailDailyDigest &&
    !emailPrefs.emailAnnouncements;

  const handleToggle = async (key: keyof typeof emailPrefs) => {
    const newPrefs = {
      ...emailPrefs,
      [key]: !emailPrefs[key],
    };

    setEmailPrefs(newPrefs);
    setIsSaving(true);

    try {
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPrefs),
      });

      if (!response.ok) {
        throw new Error("Failed to save email preferences");
      }

      const updated = await response.json();

      toast({
        title: "Email preferences updated",
        description: "Your email notification settings have been saved.",
      });

      // Call onUpdate callback if provided
      if (onUpdate) {
        onUpdate(newPrefs);
      }
    } catch (error) {
      // Revert on error
      setEmailPrefs(emailPrefs);
      toast({
        title: "Error",
        description: "Failed to save email preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Mail className="h-5 w-5 inline mr-2" />
          Email Preferences
        </CardTitle>
        <CardDescription>
          Control which emails you receive from the platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {allDisabled && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have disabled all email notifications. You may miss important updates about your evaluations and progress.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="email-welcome">Welcome Emails</Label>
            <p className="text-sm text-muted-foreground">
              Receive a welcome email when you join the platform
            </p>
          </div>
          <Switch
            id="email-welcome"
            checked={emailPrefs.emailWelcome}
            onCheckedChange={() => handleToggle("emailWelcome")}
            disabled={isSaving}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="email-copy-complete">Copy Evaluation Complete</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when your answer copy evaluation is ready
            </p>
          </div>
          <Switch
            id="email-copy-complete"
            checked={emailPrefs.emailCopyComplete}
            onCheckedChange={() => handleToggle("emailCopyComplete")}
            disabled={isSaving}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="email-daily-digest">Daily News Digest</Label>
            <p className="text-sm text-muted-foreground">
              Receive a daily email with top current affairs articles
            </p>
          </div>
          <Switch
            id="email-daily-digest"
            checked={emailPrefs.emailDailyDigest}
            onCheckedChange={() => handleToggle("emailDailyDigest")}
            disabled={isSaving}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="email-announcements">Platform Announcements</Label>
            <p className="text-sm text-muted-foreground">
              Stay updated with important platform news and features
            </p>
          </div>
          <Switch
            id="email-announcements"
            checked={emailPrefs.emailAnnouncements}
            onCheckedChange={() => handleToggle("emailAnnouncements")}
            disabled={isSaving}
          />
        </div>
      </CardContent>
    </Card>
  );
}
