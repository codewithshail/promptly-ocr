import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { mockTestAttempts, mockTests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import TestInterface from "@/components/test-interface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Question } from "@/lib/services/mock-test.service";

async function TestInterfaceContent({ attemptId }: { attemptId: string }) {
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

  // Check if already completed
  if (attempt.status === "completed") {
    redirect(`/mock-tests/results/${attemptId}`);
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
  const questions: Question[] = JSON.parse(test.questions);

  return (
    <TestInterface
      attemptId={attemptId}
      testTitle={test.title}
      duration={test.duration}
      questions={questions}
    />
  );
}

export default function TestPage({ params }: { params: { attemptId: string } }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Loading test...</CardTitle>
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
      <TestInterfaceContent attemptId={params.attemptId} />
    </Suspense>
  );
}
