import { Suspense } from "react";
import { AdminTemplatesClient } from "./admin-templates-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminTemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Answer Templates</h1>
          <p className="text-slate-600 mt-1">
            Create and manage answer templates for students
          </p>
        </div>
      </div>

      <Suspense fallback={<TemplatesSkeleton />}>
        <AdminTemplatesClient />
      </Suspense>
    </div>
  );
}

function TemplatesSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-32 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
