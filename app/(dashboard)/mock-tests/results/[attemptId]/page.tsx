import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { mockTestAttempts, mockTests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import TestResults from "@/components/test-results";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MockTestEvaluationResult } from "@/lib/services/mock-test.service";

async function TestResultsContent({ attemptId }: { attemptId: string }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get the attempt
  const attempts = await db
    .select()
    .from(mockTestAttempts)
    .where(
      and(
        eq(mockTestAttempts.id, attemptId),
        eq(mockTestAttempts.userId, userId)
      )
    )
    .limit(1);

  if (attempts.length === 0) {
    redirect("/mock-tests");
  }

  const attempt = attempts[0];

  // Check if evaluation is complete
  if (!attempt.evaluationResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evaluation in Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your test is being evaluated. Please refresh the page in a few moments.
          </p>
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-pulse" style={{ width: "60%" }} />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get the test
  const tests = await db
    .select()
    .from(mockTests)
    .where(eq(mockTests.id, attempt.testId))
    .limit(1);

  if (tests.length === 0) {
    redirect("/mock-tests");
  }

  const test = tests[0];
  const evaluationResult: MockTestEvaluationResult = JSON.parse(attempt.evaluationResult);

  return (
    <TestResults
      testTitle={test.title}
      evaluationResult={evaluationResult}
      timeSpent={attempt.timeSpent || 0}
      testId={test.id}
    />
  );
}

export default function TestResultsPage({ params }: { params: { attemptId: string } }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Loading results...</CardTitle>
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
      <TestResultsContent attemptId={params.attemptId} />
    </Suspense>
  );
}
