"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

interface RevisionItem {
  id: string;
  topic: string;
  subject: string;
  nextRevisionAt: Date;
  difficulty: "easy" | "medium" | "hard";
  revisionCount: number;
}

interface RevisionCalendarProps {
  revisions: RevisionItem[];
  onDateSelect?: (date: Date) => void;
}

export function RevisionCalendar({ revisions, onDateSelect }: RevisionCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Get revisions for selected date
  const getRevisionsForDate = (date: Date) => {
    return revisions.filter((revision) =>
      isSameDay(new Date(revision.nextRevisionAt), date)
    );
  };

  // Get dates with revisions for the current month
  const getDatesWithRevisions = () => {
    if (!selectedDate) return new Set<string>();
    
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval({ start, end });

    const datesWithRevisions = new Set<string>();
    daysInMonth.forEach((day) => {
      const hasRevisions = revisions.some((revision) =>
        isSameDay(new Date(revision.nextRevisionAt), day)
      );
      if (hasRevisions) {
        datesWithRevisions.add(format(day, "yyyy-MM-dd"));
      }
    });

    return datesWithRevisions;
  };

  const datesWithRevisions = getDatesWithRevisions();
  const selectedDateRevisions = selectedDate ? getRevisionsForDate(selectedDate) : [];

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && onDateSelect) {
      onDateSelect(date);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "hard":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Revision Calendar</CardTitle>
          <CardDescription>
            View your revision schedule for the month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            className="rounded-md border"
            modifiers={{
              hasRevision: (date) => datesWithRevisions.has(format(date, "yyyy-MM-dd")),
            }}
            modifiersStyles={{
              hasRevision: {
                fontWeight: "bold",
                backgroundColor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
              },
            }}
          />
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span>Days with revisions</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
          </CardTitle>
          <CardDescription>
            {selectedDateRevisions.length > 0
              ? `${selectedDateRevisions.length} topic${selectedDateRevisions.length > 1 ? "s" : ""} scheduled`
              : "No revisions scheduled"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedDateRevisions.length > 0 ? (
            <div className="space-y-3">
              {selectedDateRevisions.map((revision) => (
                <div
                  key={revision.id}
                  className="flex items-start justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{revision.topic}</p>
                    <p className="text-sm text-muted-foreground">
                      {revision.subject}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Revision #{revision.revisionCount + 1}
                      </Badge>
                      <div
                        className={`h-2 w-2 rounded-full ${getDifficultyColor(
                          revision.difficulty
                        )}`}
                        title={`Difficulty: ${revision.difficulty}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-center text-sm text-muted-foreground">
              No revisions scheduled for this date
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
