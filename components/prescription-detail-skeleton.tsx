import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function PrescriptionDetailSkeleton() {
  return (
    <div className="container mx-auto py-4 sm:py-6 md:py-8 px-4 max-w-5xl">
      {/* Metadata Skeleton */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-8 sm:h-10 w-3/4" />
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
        <Separator />
      </div>

      {/* Audio Player Skeleton */}
      <div className="mb-4 sm:mb-6">
        <Card>
          <CardContent className="py-3 sm:py-4 px-3 sm:px-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 sm:w-5 sm:h-5 rounded" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-2 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
              <Skeleton className="h-11 sm:h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Skeleton */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 sm:w-5 sm:h-5 rounded" />
              <Skeleton className="h-6 w-48" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-64" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 p-3 sm:p-4 border rounded-md">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
