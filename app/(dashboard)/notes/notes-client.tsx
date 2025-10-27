"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NotesList } from "@/components/notes-list";
import { NoteEditor } from "@/components/note-editor";


interface NotesClientProps {
  userId: string;
}

export function NotesClient({ userId }: NotesClientProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNoteSelect = (noteId: string) => {
    setSelectedNoteId(noteId);
    setIsCreatingNew(false);
  };

  const handleCreateNew = () => {
    setSelectedNoteId(null);
    setIsCreatingNew(true);
  };

  const handleNoteSaved = () => {
    setRefreshTrigger((prev) => prev + 1);
    setIsCreatingNew(false);
    setSelectedNoteId(null);
  };

  const handleNoteDeleted = () => {
    setRefreshTrigger((prev) => prev + 1);
    setSelectedNoteId(null);
    setIsCreatingNew(false);
  };

  const handleBack = () => {
    setSelectedNoteId(null);
    setIsCreatingNew(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground">
            Organize your study materials and insights
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Notes List */}
        <div className="lg:col-span-1 overflow-hidden">
          <NotesList
            userId={userId}
            selectedNoteId={selectedNoteId}
            onNoteSelect={handleNoteSelect}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Note Editor */}
        <div className="lg:col-span-2 overflow-hidden">
          {(selectedNoteId || isCreatingNew) ? (
            <NoteEditor
              userId={userId}
              noteId={selectedNoteId}
              onSave={handleNoteSaved}
              onDelete={handleNoteDeleted}
              onBack={handleBack}
            />
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg">
              <div className="text-center space-y-4">
                <div className="text-muted-foreground">
                  <p className="text-lg">Select a note to view or edit</p>
                  <p className="text-sm">or create a new one</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
