import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isUserAdmin } from "@/lib/middleware/admin";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const isAdmin = await isUserAdmin(userId);

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
