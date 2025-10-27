import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { mockTestAttempts, mockTests } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import PerformanceTrends from "@/components/performance-trends";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

async function PerformanceTrendsContent({ testId }: { testId: string }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get the test
  const tests = await db
    .select()
    .from(mockTests)
    .where(eq(mockTests.id, testId))
    .limit(1);

  if (tests.length === 0) {
    redirect("/mock-tests");
  }

  const test = tests[0];

  // Get all attempts for this test by this user
  const attempts = await db
    .select()
    .from(mockTestAttempts)
    .where(
      and(
        eq(mockTestAttempts.testId, testId),
        eq(mockTestAttempts.userId, userId)
      )
    )
    .orderBy(desc(mockTestAttempts.startedAt));

  if (attempts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/mock-tests">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Performance History</h1>
            <p className="text-muted-foreground">{test.title}</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>No Attempts Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You haven't attempted this test yet. Start your first attempt to see performance trends.
            </p>
            <Link href="/mock-tests">
              <Button>Back to Tests</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/mock-tests">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      <PerformanceTrends attempts={attempts} testTitle={test.title} />
    </div>
  );
}

export default function PerformanceHistoryPage({ params }: { params: { testId: string } }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Loading performance data...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-muted rounded w-full animate-pulse" />
                <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <PerformanceTrendsContent testId={params.testId} />
    </Suspense>
  );
}
