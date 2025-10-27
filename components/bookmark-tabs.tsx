"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookmarkedNewsList } from "./bookmarked-news-list";
import { BookmarkedTipsList } from "./bookmarked-tips-list";
import { Newspaper, Lightbulb } from "lucide-react";

interface BookmarkTabsProps {
  userId: string;
}

export function BookmarkTabs({ userId }: BookmarkTabsProps) {
  return (
    <Tabs defaultValue="news" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="news" className="flex items-center gap-2">
          <Newspaper className="h-4 w-4" />
          News Articles
        </TabsTrigger>
        <TabsTrigger value="tips" className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Tips & Tricks
        </TabsTrigger>
      </TabsList>

      <TabsContent value="news" className="mt-6">
        <BookmarkedNewsList userId={userId} />
      </TabsContent>

      <TabsContent value="tips" className="mt-6">
        <BookmarkedTipsList userId={userId} />
      </TabsContent>
    </Tabs>
  );
}
