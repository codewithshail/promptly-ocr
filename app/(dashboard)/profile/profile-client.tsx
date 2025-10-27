"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Flame, TrendingUp, FileText, Award, Bell, Settings } from "lucide-react";
import { StreakCalendar } from "@/components/streak-calendar";
import { StreakCelebration } from "@/components/streak-celebration";
import { WeakAreasDisplay } from "@/components/weak-areas-display";
import { StudyPlan } from "@/components/study-plan";
import { ImprovementTracker } from "@/components/improvement-tracker";
import { EmailPreferences } from "@/components/email-preferences";
import { NewsPreferences } from "@/components/news-preferences";

interface ProfileClientProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    imageUrl: string;
  };
  preferences: {
    newsCategories: string[];
    thinkingModeDefault: boolean;
    notificationSettings: Record<string, boolean>;
    dailyStreak: number;
    lastActivityDate: string | null;
    leaderboardOptIn: boolean;
    emailWelcome: boolean;
    emailCopyComplete: boolean;
    emailDailyDigest: boolean;
    emailAnnouncements: boolean;
  };
  stats: {
    totalEvaluations: number;
    averageScore: number;
    evaluations: Array<{
      id: string;
      copyType: string;
      fileName: string;
      createdAt: string;
      score: number;
    }>;
  };
}



export function ProfileClient({ user, preferences, stats }: ProfileClientProps) {
  const { toast } = useToast();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    preferences.newsCategories
  );
  const [thinkingMode, setThinkingMode] = useState(
    preferences.thinkingModeDefault
  );
  const [notifications, setNotifications] = useState(
    preferences.notificationSettings
  );
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(
    preferences.leaderboardOptIn
  );
  const [emailPrefs, setEmailPrefs] = useState({
    emailWelcome: preferences.emailWelcome,
    emailCopyComplete: preferences.emailCopyComplete,
    emailDailyDigest: preferences.emailDailyDigest,
    emailAnnouncements: preferences.emailAnnouncements,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activities, setActivities] = useState<Array<{ date: Date; count: number }>>([]);
  const [previousStreak, setPreviousStreak] = useState(preferences.dailyStreak);

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    // Check if streak changed (for celebration)
    if (preferences.dailyStreak !== previousStreak) {
      setPreviousStreak(preferences.dailyStreak);
    }
  }, [preferences.dailyStreak]);

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/activities/calendar");
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities.map((a: any) => ({
          ...a,
          date: new Date(a.date),
        })));
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newsCategories: selectedCategories,
          thinkingModeDefault: thinkingMode,
          notificationSettings: notifications,
          leaderboardOptIn,
        }),
      });

      if (!response.ok) throw new Error("Failed to save preferences");

      toast({
        title: "Preferences saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNewsPreferences = async (categories: string[]) => {
    try {
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newsCategories: categories,
        }),
      });

      if (!response.ok) throw new Error("Failed to save preferences");

      // Update local state
      setSelectedCategories(categories);

      return true;
    } catch (error) {
      console.error("Failed to save news preferences:", error);
      return false;
    }
  };

  const toggleNotification = (key: string) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Streak Celebration */}
      <StreakCelebration
        streak={preferences.dailyStreak}
        previousStreak={previousStreak}
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your preferences and view your progress
        </p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            {user.imageUrl && (
              <img
                src={user.imageUrl}
                alt={user.firstName}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <CardTitle>
                {user.firstName} {user.lastName}
              </CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{preferences.dailyStreak} days</div>
            <p className="text-xs text-muted-foreground">
              Keep it up! Stay consistent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Evaluations
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvaluations}</div>
            <p className="text-xs text-muted-foreground">
              Answers evaluated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}/100</div>
            <p className="text-xs text-muted-foreground">
              Across all evaluations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="history">
            <FileText className="h-4 w-4 mr-2" />
            Evaluation History
          </TabsTrigger>
          <TabsTrigger value="progress">
            <TrendingUp className="h-4 w-4 mr-2" />
            Progress
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <NewsPreferences
            initialCategories={selectedCategories as any}
            onSave={handleSaveNewsPreferences}
          />

          <Card>
            <CardHeader>
              <CardTitle>Chatbot Settings</CardTitle>
              <CardDescription>
                Configure your AI chatbot preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="thinking-mode">
                    Enable Thinking Mode by Default
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get deeper reasoning and analysis in chatbot responses
                  </p>
                </div>
                <Switch
                  id="thinking-mode"
                  checked={thinkingMode}
                  onCheckedChange={setThinkingMode}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Bell className="h-5 w-5 inline mr-2" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Choose which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Evaluation Complete</Label>
                  <p className="text-sm text-muted-foreground">
                    When your copy evaluation is ready
                  </p>
                </div>
                <Switch
                  checked={notifications.evaluationComplete ?? true}
                  onCheckedChange={() =>
                    toggleNotification("evaluationComplete")
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Daily Quiz Ready</Label>
                  <p className="text-sm text-muted-foreground">
                    When new daily quiz is available
                  </p>
                </div>
                <Switch
                  checked={notifications.quizReady ?? true}
                  onCheckedChange={() => toggleNotification("quizReady")}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Revision Due</Label>
                  <p className="text-sm text-muted-foreground">
                    Reminders for scheduled revisions
                  </p>
                </div>
                <Switch
                  checked={notifications.revisionDue ?? true}
                  onCheckedChange={() => toggleNotification("revisionDue")}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Streak Milestones</Label>
                  <p className="text-sm text-muted-foreground">
                    Celebrate your streak achievements
                  </p>
                </div>
                <Switch
                  checked={notifications.streakMilestone ?? true}
                  onCheckedChange={() => toggleNotification("streakMilestone")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leaderboard Participation</CardTitle>
              <CardDescription>
                Choose whether to participate in the anonymous leaderboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="leaderboard-opt-in">
                    Participate in Leaderboard
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Your identity will remain anonymous. Only your performance metrics will be visible.
                  </p>
                </div>
                <Switch
                  id="leaderboard-opt-in"
                  checked={leaderboardOptIn}
                  onCheckedChange={setLeaderboardOptIn}
                />
              </div>
            </CardContent>
          </Card>

          <EmailPreferences
            preferences={emailPrefs}
            onUpdate={(newPrefs) => setEmailPrefs(newPrefs)}
          />

          <div className="flex justify-end">
            <Button onClick={handleSavePreferences} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </TabsContent>

        {/* Evaluation History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Evaluations</CardTitle>
              <CardDescription>
                Your last 10 copy evaluations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.evaluations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No evaluations yet. Upload your first copy to get started!
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.evaluations.map((evaluation) => (
                    <div
                      key={evaluation.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{evaluation.fileName}</p>
                          <Badge variant="outline">
                            {evaluation.copyType.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(evaluation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {evaluation.score}
                        </p>
                        <p className="text-xs text-muted-foreground">/ 100</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <StreakCalendar
            activities={activities}
            currentStreak={preferences.dailyStreak}
          />

          <Card>
            <CardHeader>
              <CardTitle>Your Study Plan</CardTitle>
              <CardDescription>
                Personalized plan based on your weak areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudyPlan userId={user.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weak Areas Analysis</CardTitle>
              <CardDescription>
                Areas that need more focus and improvement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeakAreasDisplay weakAreas={[]} showAll={true} />
            </CardContent>
          </Card>

          <ImprovementTracker userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
