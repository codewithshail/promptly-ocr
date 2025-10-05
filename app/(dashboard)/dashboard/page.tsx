import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getPrescriptionsByUserId } from "@/db/queries";
import { PrescriptionList } from "@/components/prescription-list";
import { EmptyState } from "@/components/empty-state";
import { QuickUploadButton } from "@/components/quick-upload-button";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const prescriptions = await getPrescriptionsByUserId(userId);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage and view your recent prescriptions
          </p>
        </div>
        {prescriptions.length > 0 && <QuickUploadButton />}
      </div>

      {prescriptions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold">Recent Prescriptions</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {prescriptions.length} total
            </p>
          </div>
          <PrescriptionList prescriptions={prescriptions} />
        </div>
      )}
    </div>
  );
}
