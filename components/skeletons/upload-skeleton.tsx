import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function UploadSkeleton() {
  return (
    <div className="space-y-6">
      {/* Type selector skeleton */}
      <Card className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="flex gap-4">
          <Skeleton className="h-24 w-48" />
          <Skeleton className="h-24 w-48" />
        </div>
      </Card>

      {/* Upload area skeleton */}
      <Card className="p-8">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
      </Card>
    </div>
  );
}

export function UploadProgressSkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-4 w-64" />
      </div>
    </Card>
  );
}
