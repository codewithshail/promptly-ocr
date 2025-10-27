"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  BookTemplate,
  Newspaper,
  Users,
  Megaphone,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Mock Tests",
    href: "/admin/mock-tests",
    icon: FileText,
  },
  {
    title: "Templates",
    href: "/admin/templates",
    icon: BookTemplate,
  },
  {
    title: "News Management",
    href: "/admin/news",
    icon: Newspaper,
  },
  {
    title: "User Management",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Announcements",
    href: "/admin/announcements",
    icon: Megaphone,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-6 w-6 text-amber-400" />
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
        <Badge variant="outline" className="bg-amber-400/10 text-amber-400 border-amber-400/20">
          Administrator
        </Badge>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-amber-400 text-slate-900 font-medium"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Platform</span>
        </Link>
      </div>
    </aside>
  );
}
