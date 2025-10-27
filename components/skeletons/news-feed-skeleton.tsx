import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function NewsFeedSkeleton() {
  return (
    <div className="space-y-4">
      {/* Preference selector skeleton */}
      <Card className="p-4">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="flex flex-wrap gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>
      </Card>

      {/* News cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
