import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminMockTestsClient } from "./admin-mock-tests-client";

export default function AdminMockTestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mock Tests</h1>
          <p className="text-slate-600 mt-1">
            Create and manage mock test series
          </p>
        </div>
      </div>

      <Suspense fallback={<MockTestsSkeleton />}>
        <AdminMockTestsClient />
      </Suspense>
    </div>
  );
}

function MockTestsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
