"use client";

import { useState } from "react";
import { BookmarkTabs } from "@/components/bookmark-tabs";
import { Bookmark } from "lucide-react";

interface BookmarksClientProps {
  userId: string;
}

export function BookmarksClient({ userId }: BookmarksClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Bookmark className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Bookmarks</h1>
          <p className="text-muted-foreground">
            Your saved news articles and tips for quick access
          </p>
        </div>
      </div>

      <BookmarkTabs userId={userId} />
    </div>
  );
}
