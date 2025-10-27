'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
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
  Menu,
  X,
  Flame,
  GraduationCap,
  MessageSquarePlus,
  Trash2,
  History,
  CreditCard,
  Calendar,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface SidebarProps {
  streak?: number;
  userName?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    label: 'Study Tools',
    items: [
      { id: 'chatbot', label: 'Chatbot', icon: MessageSquare, href: '/chatbot' },
      { id: 'copy-checking', label: 'Copy Checking', icon: FileCheck, href: '/copy-checking' },
      { id: 'history', label: 'Answer History', icon: History, href: '/history' },
      { id: 'mock-tests', label: 'Mock Tests', icon: ClipboardList, href: '/mock-tests' },
    ],
  },
  {
    label: 'Learning Resources',
    items: [
      { id: 'current-affairs', label: 'Current Affairs', icon: Newspaper, href: '/current-affairs' },
      { id: 'tips', label: 'Tips & Tricks', icon: Lightbulb, href: '/tips' },
      { id: 'templates', label: 'Templates', icon: FileText, href: '/templates' },
    ],
  },
  {
    label: 'Personal',
    items: [
      { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark, href: '/bookmarks' },
      { id: 'notes', label: 'Notes', icon: StickyNote, href: '/notes' },
      { id: 'flashcards', label: 'Flashcards', icon: CreditCard, href: '/flashcards' },
      { id: 'revision', label: 'Revision Scheduler', icon: Calendar, href: '/revision' },
    ],
  },
  {
    label: 'Progress',
    items: [
      { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, href: '/leaderboard' },
      { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
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
  "Success doesn't just find you. You have to go out and get it.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Don't stop when you're tired. Stop when you're done.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Do something today that your future self will thank you for.",
];

export function Sidebar({ streak = 0, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [quote, setQuote] = useState('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string; title: string } | null>(null);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    // Set a random motivational quote on mount
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setQuote(randomQuote);
    
    // Load bookmark count
    if (user) {
      loadBookmarkCount();
    }
  }, [user]);

  // Load chat sessions when on chatbot page
  useEffect(() => {
    if (user && pathname?.startsWith('/chatbot')) {
      loadChatSessions();
      setShowChatHistory(true);
    } else {
      setShowChatHistory(false);
    }
  }, [user, pathname]);

  const loadChatSessions = async () => {
    try {
      setIsLoadingSessions(true);
      const response = await fetch('/api/chat/sessions');
      
      if (!response.ok) {
        throw new Error('Failed to load sessions');
      }

      const data = await response.json();
      setChatSessions(data.sessions || []);
    } catch (error) {
      console.error('Load sessions error:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadBookmarkCount = async () => {
    try {
      const response = await fetch('/api/bookmarks');
      
      if (response.ok) {
        const data = await response.json();
        setBookmarkCount(data.count || 0);
      }
    } catch (error) {
      console.error('Load bookmark count error:', error);
    }
  };

  const handleNewChat = () => {
    router.push('/chatbot');
    setIsMobileOpen(false);
  };

  const handleSelectSession = (sessionId: string) => {
    router.push(`/chatbot/${sessionId}`);
    setIsMobileOpen(false);
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
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      // Reload sessions
      await loadChatSessions();

      // If deleted current session, go to new chat
      if (pathname === `/chatbot/${sessionToDelete.id}`) {
        router.push('/chatbot');
      }

      toast({
        title: 'Success',
        description: 'Chat deleted successfully',
      });
    } catch (error) {
      console.error('Delete session error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete chat',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const isActive = (href: string) => {
    if (href === '/chatbot') {
      return pathname === '/dashboard' || pathname === '/chatbot' || pathname?.startsWith('/chatbot/');
    }
    return pathname?.startsWith(href);
  };

  const getCurrentSessionId = () => {
    if (pathname?.startsWith('/chatbot/')) {
      return pathname.split('/chatbot/')[1];
    }
    return null;
  };

  const SidebarContent = () => (
    <>
      {/* Header with Logo and Streak */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <Link href="/chatbot" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">UPSC Prep</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover:bg-gray-100 active:scale-95 transition-transform touch-manipulation"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Streak Display */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-full p-2">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Daily Streak</p>
              <p className="text-2xl font-bold text-orange-600">{streak} days</p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Navigation Items - Grouped */}
      <ScrollArea className="flex-1 px-3 py-4 overscroll-contain">
        <nav className="space-y-6">
          {navigationGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {group.label}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const badge = item.id === 'bookmarks' ? bookmarkCount : item.badge;

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all touch-manipulation active:scale-[0.98]',
                        active
                          ? 'bg-blue-50 text-blue-700 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200'
                      )}
                    >
                      <Icon className={cn('h-5 w-5', active ? 'text-blue-600' : 'text-gray-500')} />
                      <span className="flex-1">{item.label}</span>
                      {badge !== undefined && badge > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Chat History Section - Only show when on chatbot page */}
        {showChatHistory && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-700">Chat History</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewChat}
                  className="h-7 px-2"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                </Button>
              </div>

              {isLoadingSessions ? (
                <div className="space-y-2 px-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-14 bg-gray-100 animate-pulse rounded-md"
                    />
                  ))}
                </div>
              ) : chatSessions.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-3 px-3">
                  No chat history yet
                </p>
              ) : (
                <div className="space-y-1">
                  {chatSessions.slice(0, 5).map((session) => {
                    const currentSessionId = getCurrentSessionId();
                    const isCurrentSession = session.sessionId === currentSessionId;
                    
                    return (
                      <div
                        key={session.sessionId}
                        className={cn(
                          'group relative px-3 py-2 rounded-md cursor-pointer transition-colors mx-2',
                          isCurrentSession
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-100'
                        )}
                        onClick={() => handleSelectSession(session.sessionId)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'text-xs font-medium truncate',
                              isCurrentSession ? 'text-blue-700' : 'text-gray-700'
                            )}>
                              {session.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(session.updatedAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDeleteClick(session.sessionId, session.title, e)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {chatSessions.length > 5 && (
                    <p className="text-xs text-gray-500 text-center py-2">
                      +{chatSessions.length - 5} more chats
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </ScrollArea>

      <Separator />

      {/* User Profile Section */}
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
          <UserButton afterSignOutUrl="/" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userName || 'UPSC Aspirant'}
            </p>
            {streak > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <Flame className="h-3 w-3 text-orange-500" />
                <p className="text-xs text-gray-600">{streak} day streak</p>
              </div>
            )}
          </div>
        </div>

        {/* Motivational Quote */}
        {quote && (
          <div className="mt-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-4 border border-blue-100">
            <p className="text-xs font-medium text-blue-900 mb-1">💡 Daily Motivation</p>
            <p className="text-sm text-gray-700 italic leading-relaxed">{quote}</p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-white shadow-md hover:bg-gray-100 active:scale-95 transition-transform touch-manipulation"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out lg:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        <SidebarContent />
      </aside>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{sessionToDelete?.title}"? This action cannot be undone and all messages in this chat will be permanently deleted.
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
