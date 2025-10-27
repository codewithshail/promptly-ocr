"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { NotificationBell } from "@/components/notification-bell";

const routeNames: Record<string, string> = {
  chatbot: "Chatbot",
  "copy-checking": "Copy Checking",
  "current-affairs": "Current Affairs",
  tips: "Tips & Tricks",
  bookmarks: "Bookmarks",
  notes: "Notes",
  "mock-tests": "Mock Tests",
  templates: "Templates",
  profile: "Profile",
  dashboard: "Dashboard",
};

export function AppNavbar() {
  const pathname = usePathname();

  const getBreadcrumbs = () => {
    if (!pathname) return [];

    const paths = pathname.split("/").filter(Boolean);
    const breadcrumbs = [];

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      const href = "/" + paths.slice(0, i + 1).join("/");
      const name = routeNames[path] || path;

      breadcrumbs.push({
        name,
        href,
        isLast: i === paths.length - 1,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <Fragment key={crumb.href}>
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>
                    {crumb.name}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!crumb.isLast && <BreadcrumbSeparator />}
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Notification Bell and User Button on the right */}
      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-9 h-9",
            },
          }}
        />
      </div>
    </header>
  );
}
