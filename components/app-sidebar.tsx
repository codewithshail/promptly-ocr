"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  MessageSquare,
  FileCheck,
  Newspaper,
  Lightbulb,
  Bookmark,
  StickyNote,
  ClipboardList,
  FileText,
  User,
  Flame,
  GraduationCap,
  MessageSquarePlus,
  Trash2,
  History,
  ChevronRight,
  CreditCard,
  Calendar,
  Trophy,
  LayoutDashboard,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  streak?: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    label: "Study Tools",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { id: "chatbot", label: "Chatbot", icon: MessageSquare, href: "/chatbot" },
      { id: "copy-checking", label: "Copy Checking", icon: FileCheck, href: "/copy-checking" },
      { id: "history", label: "Answer History", icon: History, href: "/history" },
      { id: "mock-tests", label: "Mock Tests", icon: ClipboardList, href: "/mock-tests" },
    ],
  },
  {
    label: "Learning Resources",
    items: [
      { id: "current-affairs", label: "Current Affairs", icon: Newspaper, href: "/current-affairs" },
      { id: "tips", label: "Tips & Tricks", icon: Lightbulb, href: "/tips" },
      { id: "templates", label: "Templates", icon: FileText, href: "/templates" },
    ],
  },
  {
    label: "Personal",
    items: [
      { id: "bookmarks", label: "Bookmarks", icon: Bookmark, href: "/bookmarks" },
      { id: "notes", label: "Notes", icon: StickyNote, href: "/notes" },
      { id: "flashcards", label: "Flashcards", icon: CreditCard, href: "/flashcards" },
      { id: "revision", label: "Revision Scheduler", icon: Calendar, href: "/revision" },
    ],
  },
  {
    label: "Progress",
    items: [
      { id: "leaderboard", label: "Leaderboard", icon: Trophy, href: "/leaderboard" },
      { id: "profile", label: "Profile", icon: User, href: "/profile" },
    ],
  },
];

interface ChatSession {
  sessionId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

const motivationalQuotes = [
  "Success is the sum of small efforts repeated day in and day out.",
  "The expert in anything was once a beginner.",
  "Your limitation—it's only your imagination.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
];

export function AppSidebar({ streak = 0, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [quote, setQuote] = React.useState("");
  const [chatSessions, setChatSessions] = React.useState<ChatSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [sessionToDelete, setSessionToDelete] = React.useState<{ id: string; title: string } | null>(null);
  const [bookmarkCount, setBookmarkCount] = React.useState(0);

  React.useEffect(() => {
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setQuote(randomQuote);
    
    if (user) {
      loadBookmarkCount();
    }
  }, [user]);

  React.useEffect(() => {
    if (user && pathname?.startsWith("/chatbot")) {
      loadChatSessions();
    }
  }, [user, pathname]);

  const loadChatSessions = async () => {
    try {
      setIsLoadingSessions(true);
      const response = await fetch("/api/chat/sessions");
      
      if (!response.ok) throw new Error("Failed to load sessions");

      const data = await response.json();
      setChatSessions(data.sessions || []);
    } catch (error) {
      console.error("Load sessions error:", error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadBookmarkCount = async () => {
    try {
      const response = await fetch("/api/bookmarks");
      if (response.ok) {
        const data = await response.json();
        setBookmarkCount(data.count || 0);
      }
    } catch (error) {
      console.error("Load bookmark count error:", error);
    }
  };

  const handleNewChat = () => {
    router.push("/chatbot");
  };

  const handleSelectSession = (sessionId: string) => {
    router.push(`/chatbot/${sessionId}`);
  };

  const handleDeleteClick = (sessionId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionToDelete({ id: sessionId, title });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    
    try {
      const response = await fetch(`/api/chat/sessions/${sessionToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete session");

      await loadChatSessions();

      if (pathname === `/chatbot/${sessionToDelete.id}`) {
        router.push("/chatbot");
      }

      toast({
        title: "Success",
        description: "Chat deleted successfully",
      });
    } catch (error) {
      console.error("Delete session error:", error);
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const isActive = (href: string) => {
    if (href === "/chatbot") {
      return pathname === "/chatbot" || pathname?.startsWith("/chatbot/");
    }
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname?.startsWith(href);
  };

  const getCurrentSessionId = () => {
    if (pathname?.startsWith("/chatbot/")) {
      return pathname.split("/chatbot/")[1];
    }
    return null;
  };

  const truncateTitle = (title: string, maxLength: number = 30) => {
    if (title.length <= maxLength) return title;
    return title.slice(0, maxLength) + "...";
  };

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/chatbot">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <GraduationCap className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">UPSC Prep</span>
                    <span className="truncate text-xs text-muted-foreground">
                      Your Study Companion
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {/* Streak Display */}
          <SidebarGroup>
            <div className="mx-2 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 p-3 border border-orange-200">
              <div className="flex items-center gap-2">
                <div className="bg-white rounded-full p-1.5">
                  <Flame className="h-4 w-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600">Daily Streak</p>
                  <p className="text-lg font-bold text-orange-600">{streak} days</p>
                </div>
              </div>
            </div>
          </SidebarGroup>

          {/* Main Navigation - Grouped */}
          {navigationGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    const badge = item.id === "bookmarks" ? bookmarkCount : undefined;

                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton asChild isActive={active}>
                          <Link href={item.href}>
                            <Icon className="size-4" />
                            <span>{item.label}</span>
                            {badge !== undefined && badge > 0 && (
                              <Badge variant="secondary" className="ml-auto">
                                {badge}
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}

          {/* Chat History - Only show when on chatbot page */}
          {pathname?.startsWith("/chatbot") && (
            <SidebarGroup>
              <SidebarGroupLabel>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <History className="size-3" />
                    <span>Chat History</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={handleNewChat}
                  >
                    <MessageSquarePlus className="size-3" />
                  </Button>
                </div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {isLoadingSessions ? (
                    <>
                      {[1, 2, 3].map((i) => (
                        <SidebarMenuItem key={i}>
                          <div className="h-12 bg-muted animate-pulse rounded-md" />
                        </SidebarMenuItem>
                      ))}
                    </>
                  ) : chatSessions.length === 0 ? (
                    <div className="px-2 py-4 text-xs text-muted-foreground text-center">
                      No chat history yet
                    </div>
                  ) : (
                    <>
                      {chatSessions.slice(0, 10).map((session) => {
                        const currentSessionId = getCurrentSessionId();
                        const isCurrentSession = session.sessionId === currentSessionId;
                        
                        return (
                          <SidebarMenuItem key={session.sessionId}>
                            <SidebarMenuButton
                              asChild
                              isActive={isCurrentSession}
                              className="group h-auto py-2"
                            >
                              <div
                                className="flex items-center justify-between cursor-pointer gap-2"
                                onClick={() => handleSelectSession(session.sessionId)}
                              >
                                <div className="flex-1 min-w-0 space-y-0.5">
                                  <span className="text-xs font-medium truncate block leading-tight">
                                    {truncateTitle(session.title)}
                                  </span>
                                  <span className="text-xs text-muted-foreground block">
                                    {formatDistanceToNow(new Date(session.updatedAt), {
                                      addSuffix: true,
                                    })}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                                  onClick={(e) => handleDeleteClick(session.sessionId, session.title, e)}
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </div>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                      {chatSessions.length > 10 && (
                        <div className="px-2 py-2 text-xs text-muted-foreground text-center">
                          +{chatSessions.length - 10} more chats
                        </div>
                      )}
                    </>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-2 rounded-lg bg-muted p-2">
                <UserButton afterSignOutUrl="/" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.firstName || "UPSC Aspirant"}
                  </p>
                  {streak > 0 && (
                    <div className="flex items-center gap-1">
                      <Flame className="size-3 text-orange-500" />
                      <p className="text-xs text-muted-foreground">{streak} day streak</p>
                    </div>
                  )}
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>

          {/* Motivational Quote */}
          {quote && (
            <div className="mx-2 mb-2 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-3 border border-blue-100">
              <p className="text-xs font-medium text-blue-900 mb-1">💡 Daily Motivation</p>
              <p className="text-xs text-gray-700 italic leading-relaxed">{quote}</p>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{sessionToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
