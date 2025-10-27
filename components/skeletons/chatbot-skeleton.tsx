import { Skeleton } from "@/components/ui/skeleton";

export function ChatbotSkeleton() {
  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Message skeletons */}
      <div className="flex-1 space-y-4 p-4">
        {/* User message */}
        <div className="flex justify-end">
          <div className="max-w-[80%] space-y-2">
            <Skeleton className="h-16 w-64" />
          </div>
        </div>

        {/* Assistant message */}
        <div className="flex justify-start">
          <div className="max-w-[80%] space-y-2">
            <Skeleton className="h-24 w-96" />
          </div>
        </div>

        {/* User message */}
        <div className="flex justify-end">
          <div className="max-w-[80%] space-y-2">
            <Skeleton className="h-12 w-48" />
          </div>
        </div>

        {/* Assistant message */}
        <div className="flex justify-start">
          <div className="max-w-[80%] space-y-2">
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>

      {/* Input skeleton */}
      <div className="p-4 border-t">
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
