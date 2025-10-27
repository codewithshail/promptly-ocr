import { currentUser } from '@clerk/nextjs/server';
import { AppSidebar } from '@/components/app-sidebar';
import { AppNavbar } from '@/components/app-navbar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { db } from '@/db';
import { userPreferences } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function getUserStreak(userId: string): Promise<number> {
  try {
    const preferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    return preferences[0]?.dailyStreak ?? 0;
  } catch (error) {
    console.error('Error fetching user streak:', error);
    return 0;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const streak = user ? await getUserStreak(user.id) : 0;

  return (
    <SidebarProvider>
      <AppSidebar streak={streak} />
      <SidebarInset className="overflow-x-hidden">
        <AppNavbar />
        <main id="main-content" className="flex flex-1 flex-col gap-4 p-4 pt-0 overflow-x-hidden">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-4 md:p-6 overflow-x-hidden">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
