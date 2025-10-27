"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, subDays, startOfWeek, addDays, isSameDay } from "date-fns";

interface Activity {
  date: Date;
  count: number;
}

interface StreakCalendarProps {
  activities: Activity[];
  currentStreak: number;
}

export function StreakCalendar({ activities, currentStreak }: StreakCalendarProps) {
  const weeks = useMemo(() => {
    const today = new Date();
    const startDate = subDays(today, 90); // Show last 90 days
    const start = startOfWeek(startDate);

    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    for (let i = 0; i < 98; i++) {
      // ~14 weeks
      const date = addDays(start, i);
      currentWeek.push(date);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, []);

  const getActivityLevel = (date: Date): number => {
    const activity = activities.find((a) => isSameDay(new Date(a.date), date));
    return activity?.count || 0;
  };

  const getColorClass = (level: number): string => {
    if (level === 0) return "bg-gray-100 dark:bg-gray-800";
    if (level === 1) return "bg-green-200 dark:bg-green-900";
    if (level === 2) return "bg-green-400 dark:bg-green-700";
    if (level >= 3) return "bg-green-600 dark:bg-green-500";
    return "bg-gray-100 dark:bg-gray-800";
  };

  const totalActiveDays = activities.filter((a) => a.count > 0).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Calendar</CardTitle>
        <CardDescription>
          Your study activity over the last 90 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-semibold">{currentStreak}</span> day current streak
            </div>
            <div>
              <span className="font-semibold">{totalActiveDays}</span> active days
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-flex flex-col gap-1">
              <div className="flex gap-1 text-xs text-muted-foreground mb-1">
                <div className="w-6"></div>
                {["Mon", "Wed", "Fri"].map((day, i) => (
                  <div key={day} className="w-3 text-center" style={{ marginLeft: i === 0 ? 0 : "calc(2 * 0.25rem + 2 * 0.75rem)" }}>
                    {day}
                  </div>
                ))}
              </div>

              <div className="flex gap-1">
                <div className="flex flex-col gap-1 text-xs text-muted-foreground justify-around">
                  <div>Sun</div>
                  <div>Wed</div>
                  <div>Sat</div>
                </div>

                <TooltipProvider>
                  <div className="flex gap-1">
                    {weeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col gap-1">
                        {week.map((date, dayIndex) => {
                          const level = getActivityLevel(date);
                          const isToday = isSameDay(date, new Date());
                          const isFuture = date > new Date();

                          if (isFuture) {
                            return (
                              <div
                                key={dayIndex}
                                className="w-3 h-3 rounded-sm bg-transparent"
                              />
                            );
                          }

                          return (
                            <Tooltip key={dayIndex}>
                              <TooltipTrigger asChild>
                                <div
                                  className={`w-3 h-3 rounded-sm ${getColorClass(level)} ${
                                    isToday ? "ring-2 ring-primary ring-offset-1" : ""
                                  } hover:ring-2 hover:ring-gray-400 transition-all cursor-pointer`}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-semibold">
                                  {format(date, "MMM dd, yyyy")}
                                </p>
                                <p className="text-sm">
                                  {level === 0
                                    ? "No activity"
                                    : `${level} ${level === 1 ? "activity" : "activities"}`}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
              <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
              <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
              <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
