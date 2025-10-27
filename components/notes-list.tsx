"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, StickyNote, Filter, X } from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Note {
  id: string;
  title: string;
  content: string;
  category: string | null;
  tags: string | null;
  sourceType: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotesListProps {
  userId: string;
  selectedNoteId: string | null;
  onNoteSelect: (noteId: string) => void;
  refreshTrigger: number;
}

export function NotesList({
  userId,
  selectedNoteId,
  onNoteSelect,
  refreshTrigger,
}: NotesListProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchNotes();
  }, [userId, refreshTrigger]);

  useEffect(() => {
    filterNotes();
  }, [notes, searchQuery, selectedCategory]);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/notes");

      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }

      const data = await response.json();
      setNotes(data.notes);

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(
          data.notes
            .map((note: Note) => note.category)
            .filter((cat: string | null) => cat !== null)
        )
      ) as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterNotes = () => {
    let filtered = [...notes];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((note) => note.category === selectedCategory);
    }

    setFilteredNotes(filtered);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
  };

  const hasActiveFilters = searchQuery.trim() !== "" || selectedCategory !== null;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="pt-6 flex-1 flex flex-col min-h-0">
        {/* Search and Filter */}
        <div className="space-y-2 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Category
                  {selectedCategory && (
                    <Badge variant="secondary" className="ml-1">
                      1
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Filter by category</p>
                  <div className="space-y-1">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={
                          selectedCategory === category ? "secondary" : "ghost"
                        }
                        size="sm"
                        className="w-full justify-start"
                        onClick={() =>
                          setSelectedCategory(
                            selectedCategory === category ? null : category
                          )
                        }
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Notes List */}
        <ScrollArea className="flex-1">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8">
              <StickyNote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {hasActiveFilters ? "No notes match your filters" : "No notes yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {hasActiveFilters
                  ? "Try adjusting your search or filters"
                  : "Create your first note to get started"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 pr-4">
              {filteredNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => onNoteSelect(note.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedNoteId === note.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted border-transparent"
                  }`}
                >
                  <div className="space-y-1">
                    <h3 className="font-medium line-clamp-1">{note.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {note.content}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {note.category && (
                        <Badge variant="secondary" className="text-xs">
                          {note.category}
                        </Badge>
                      )}
                      {note.sourceType && (
                        <Badge variant="outline" className="text-xs">
                          {note.sourceType}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.updatedAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
