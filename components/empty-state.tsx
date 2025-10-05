import { FileText } from "lucide-react";
import { QuickUploadButton } from "./quick-upload-button";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white p-8 sm:p-12 text-center transition-all hover:border-muted-foreground/30">
      <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-blue-100 transition-transform hover:scale-110">
        <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
      </div>
      <h3 className="mt-4 text-base sm:text-lg font-semibold text-gray-900">
        No prescriptions yet
      </h3>
      <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-sm px-4">
        Get started by uploading your first prescription. We&apos;ll extract the text
        and make it available for audio playback.
      </p>
      <div className="mt-6">
        <QuickUploadButton />
      </div>
    </div>
  );
}
