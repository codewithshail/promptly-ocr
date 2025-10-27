"use client";

import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StreakDisplayProps {
  streak: number;
  compact?: boolean;
}

export function StreakDisplay({ streak, compact = false }: StreakDisplayProps) {
  const getStreakColor = (streak: number) => {
    if (streak >= 100) return "text-purple-500";
    if (streak >= 30) return "text-orange-500";
    if (streak >= 7) return "text-yellow-500";
    return "text-gray-500";
  };

  const getStreakMessage = (streak: number) => {
    if (streak >= 100) return "Legendary! 100+ day streak! 🏆";
    if (streak >= 30) return "Amazing! 30+ day streak! 🔥";
    if (streak >= 7) return "Great! 7+ day streak! ⭐";
    if (streak >= 3) return "Keep it up! 3+ day streak! 💪";
    if (streak >= 1) return "You're on a streak! Keep going! 🎯";
    return "Start your streak today!";
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-1 cursor-help">
              <Flame className={`h-3 w-3 ${getStreakColor(streak)}`} />
              <span className="font-semibold">{streak}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getStreakMessage(streak)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950 rounded-lg border border-orange-200 dark:border-orange-800">
      <Flame className={`h-5 w-5 ${getStreakColor(streak)}`} />
      <div className="flex-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{streak}</span>
          <span className="text-sm text-muted-foreground">day{streak !== 1 ? "s" : ""}</span>
        </div>
        <p className="text-xs text-muted-foreground">Study streak</p>
      </div>
    </div>
  );
}
