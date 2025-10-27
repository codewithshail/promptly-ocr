import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function FlashcardDeckSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-5 w-32 mx-auto" />
      </div>

      {/* Flashcard */}
      <div className="flex justify-center">
        <Card className="w-full max-w-2xl h-96">
          <CardContent className="flex items-center justify-center h-full p-8">
            <div className="text-center space-y-4 w-full">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="h-6 w-5/6 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Progress */}
      <div className="text-center">
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  );
}
