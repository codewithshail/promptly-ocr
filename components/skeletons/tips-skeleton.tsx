import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function TipsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Subject selector skeleton */}
      <div>
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="p-6 space-y-3">
              <Skeleton className="h-12 w-12 rounded-full mx-auto" />
              <Skeleton className="h-6 w-32 mx-auto" />
            </Card>
          ))}
        </div>
      </div>

      {/* Tips content skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-6 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
