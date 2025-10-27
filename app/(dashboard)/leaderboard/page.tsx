import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LeaderboardClient } from "./leaderboard-client";

export const metadata = {
  title: "Leaderboard | UPSC Aspirant Platform",
  description: "Compare your performance with peers anonymously",
};

export default async function LeaderboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardClient userId={userId} />
      </Suspense>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 bg-muted animate-pulse rounded" />
      <div className="h-32 bg-muted animate-pulse rounded-lg" />
      <div className="h-96 bg-muted animate-pulse rounded-lg" />
    </div>
  );
}
