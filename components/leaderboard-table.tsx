"use client";

import { LeaderboardEntry } from "@/lib/services/analytics.service";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export function LeaderboardTable({
  entries,
  currentUserId,
}: LeaderboardTableProps) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    } else if (rank === 2) {
      return <Medal className="h-5 w-5 text-gray-400" />;
    } else if (rank === 3) {
      return <Award className="h-5 w-5 text-amber-600" />;
    }
    return null;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Rank</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Points</TableHead>
            <TableHead className="text-right">Avg Score</TableHead>
            <TableHead className="text-right">Streak</TableHead>
            <TableHead className="text-right">Tests</TableHead>
            <TableHead className="text-right">Evaluations</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No leaderboard data available yet
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry) => (
              <TableRow
                key={entry.anonymousId}
                className={
                  entry.isCurrentUser
                    ? "bg-primary/5 font-medium border-l-4 border-l-primary"
                    : ""
                }
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getRankIcon(entry.rank)}
                    <span className="font-semibold">{entry.rank}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {entry.anonymousId}
                    {entry.isCurrentUser && (
                      <Badge variant="secondary" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {entry.totalPoints.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {entry.averageScore.toFixed(1)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline">{entry.streak} days</Badge>
                </TableCell>
                <TableCell className="text-right">{entry.testsCompleted}</TableCell>
                <TableCell className="text-right">
                  {entry.evaluationsCompleted}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
