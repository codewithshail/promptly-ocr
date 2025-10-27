import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { mockTests } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import TestDetailCard from "@/components/test-detail-card";

async function MockTestsContent() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch all available mock tests
  const availableTests = await db
    .select()
    .from(mockTests)
    .orderBy(desc(mockTests.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mock Test Series</h1>
        <p className="text-muted-foreground mt-2">
          Practice with timed mock tests and track your performance
        </p>
      </div>

      {availableTests.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              No Tests Available
            </CardTitle>
            <CardDescription>
              Mock tests will appear here once they are created by administrators.
              Check back soon!
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableTests.map((test) => (
            <TestDetailCard key={test.id} test={test} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MockTestsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mock Test Series</h1>
            <p className="text-muted-foreground mt-2">Loading tests...</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      }
    >
      <MockTestsContent />
    </Suspense>
  );
}
