import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PrescriptionListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-3 sm:p-4 animate-pulse">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Skeleton className="h-4 w-4 sm:h-5 sm:w-5 rounded flex-shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
            <Skeleton className="h-5 w-16 sm:w-20 flex-shrink-0" />
          </div>

          <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-1">
              <Skeleton className="h-3 w-3 sm:h-4 sm:w-4 rounded flex-shrink-0" />
              <Skeleton className="h-3 w-24 sm:w-32" />
            </div>

            <Skeleton className="h-3 w-20 sm:w-24" />

            <div className="space-y-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
