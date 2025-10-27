import { Suspense } from "react";
import { AdminNewsClient } from "./admin-news-client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminNewsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">News Management</h1>
          <p className="text-slate-600 mt-1">
            Manage news articles and create custom content
          </p>
        </div>
      </div>

      <Suspense fallback={<NewsSkeleton />}>
        <AdminNewsClient />
      </Suspense>
    </div>
  );
}

function NewsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
