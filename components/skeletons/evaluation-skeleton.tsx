import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function EvaluationSkeleton() {
  return (
    <div className="space-y-6">
      {/* Score card skeleton */}
      <Card className="p-6">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-16 w-32 mx-auto rounded-full" />
          <Skeleton className="h-6 w-24 mx-auto" />
        </div>
      </Card>

      {/* Breakdown skeleton */}
      <Card className="p-6 space-y-4">
        <Skeleton className="h-7 w-40" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </Card>

      {/* Feedback skeleton */}
      <Card className="p-6 space-y-4">
        <Skeleton className="h-7 w-32" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </Card>

      {/* Recommendations skeleton */}
      <Card className="p-6 space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}
