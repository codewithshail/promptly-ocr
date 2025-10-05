import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Pill } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            <Link href="/dashboard" className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              <span className="hidden sm:inline">Prescription Reader</span>
              <span className="sm:hidden">Rx Reader</span>
            </Link>
          </div>
          <nav className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/dashboard"
              className="text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link
              href="/upload"
              className="text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Upload
            </Link>
            <UserButton afterSignOutUrl="/" />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}
