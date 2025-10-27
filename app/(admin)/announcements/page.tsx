import { Suspense } from "react";
import { AdminAnnouncementsClient } from "./admin-announcements-client";

export default function AdminAnnouncementsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminAnnouncementsClient />
    </Suspense>
  );
}
