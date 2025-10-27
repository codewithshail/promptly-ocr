"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  Trash2,
  ArrowLeft,
  Loader2,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { AIHelpDialog } from "@/components/ai-help-dialog";
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

interface Note {
  id: string;
  title: string;
  content: string;
  category: string | null;
  tags: string | null;
  sourceType: string | null;
  sourceId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NoteEditorProps {
  userId: string;
  noteId: string | null;
  onSave: () => void;
  onDelete: () => void;
  onBack: () => void;
}

export function NoteEditor({
  userId,
  noteId,
  onSave,
  onDelete,
  onBack,
}: NoteEditorProps) {
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAIHelpDialog, setShowAIHelpDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (noteId) {
      fetchNote();
    } else {
      // New note
      setNote(null);
      setTitle("");
      setContent("");
      setCategory("");
      setTags([]);
      setHasUnsavedChanges(false);
    }
  }, [noteId]);

  useEffect(() => {
    // Check for unsaved changes
    if (note) {
      const hasChanges =
        title !== note.title ||
        content !== note.content ||
        category !== (note.category || "") ||
        JSON.stringify(tags) !== (note.tags || "[]");
      setHasUnsavedChanges(hasChanges);
    } else if (noteId === null) {
      // New note
      setHasUnsavedChanges(title.trim() !== "" || content.trim() !== "");
    }
  }, [title, content, category, tags, note, noteId]);

  const fetchNote = async () => {
    if (!noteId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/notes?id=${noteId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch note");
      }

      const data = await response.json();
      setNote(data.note);
      setTitle(data.note.title);
      setContent(data.note.content);
      setCategory(data.note.category || "");
      setTags(data.note.tags ? JSON.parse(data.note.tags) : []);
    } catch (error) {
      console.error("Failed to fetch note:", error);
      toast({
        title: "Error",
        description: "Failed to load note",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your note",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter content for your note",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        title: title.trim(),
        content: content.trim(),
        category: category.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      };

      const response = await fetch(
        noteId ? `/api/notes?id=${noteId}` : "/api/notes",
        {
          method: noteId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save note");
      }

      toast({
        title: "Success",
        description: noteId ? "Note updated" : "Note created",
      });

      setHasUnsavedChanges(false);
      onSave();
    } catch (error) {
      console.error("Failed to save note:", error);
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!noteId) return;

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/notes?id=${noteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      toast({
        title: "Success",
        description: "Note deleted",
      });

      onDelete();
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleAIEnhance = (enhancedContent: string) => {
    setContent(enhancedContent);
    toast({
      title: "Content enhanced",
      description: "AI suggestions have been applied to your note",
    });
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {noteId ? "Edit Note" : "New Note"}
              </h2>
              {hasUnsavedChanges && (
                <Badge variant="secondary">Unsaved changes</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {noteId && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAIHelpDialog(true)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Help
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto pt-6 space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-medium"
            />
          </div>

          {/* Content */}
          <div className="space-y-2 flex-1">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder="Write your note here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[300px] resize-none font-mono text-sm"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category (optional)</Label>
            <Input
              id="category"
              placeholder="e.g., History, Geography, Polity"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add a tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddTag}
              >
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Source Info */}
          {note?.sourceType && (
            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Source: <Badge variant="outline">{note.sourceType}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Help Dialog */}
      {noteId && (
        <AIHelpDialog
          open={showAIHelpDialog}
          onOpenChange={setShowAIHelpDialog}
          noteId={noteId}
          onApply={handleAIEnhance}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
