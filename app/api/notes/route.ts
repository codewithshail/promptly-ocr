import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { notesService } from "@/lib/services/notes.service";

/**
 * GET /api/notes - Get all notes for the authenticated user
 * Query params:
 * - id: Get a specific note by ID
 * - category: Filter by category
 * - search: Search notes by title or content
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const noteId = searchParams.get("id");
    const category = searchParams.get("category");
    const searchQuery = searchParams.get("search");

    // Get specific note
    if (noteId) {
      const note = await notesService.getNoteById(noteId, userId);

      if (!note) {
        return NextResponse.json({ error: "Note not found" }, { status: 404 });
      }

      return NextResponse.json({ note });
    }

    // Search notes
    if (searchQuery) {
      const notes = await notesService.searchNotes(userId, searchQuery);
      return NextResponse.json({ notes });
    }

    // Get notes by category
    if (category) {
      const notes = await notesService.getNotesByCategory(userId, category);
      return NextResponse.json({ notes });
    }

    // Get all notes
    const notes = await notesService.getUserNotes(userId);
    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Get notes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notes - Create a new note
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, category, tags, sourceType, sourceId } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const note = await notesService.createNote(userId, {
      title,
      content,
      category,
      tags,
      sourceType,
      sourceId,
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("Create note error:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notes - Update an existing note
 * Query params:
 * - id: Note ID (required)
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const noteId = searchParams.get("id");

    if (!noteId) {
      return NextResponse.json(
        { error: "Note ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, content, category, tags } = body;

    // Verify note exists and belongs to user
    const existingNote = await notesService.getNoteById(noteId, userId);
    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const updatedNote = await notesService.updateNote(noteId, userId, {
      title,
      content,
      category,
      tags,
    });

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    console.error("Update note error:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notes - Delete a note
 * Query params:
 * - id: Note ID (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const noteId = searchParams.get("id");

    if (!noteId) {
      return NextResponse.json(
        { error: "Note ID is required" },
        { status: 400 }
      );
    }

    // Verify note exists and belongs to user
    const existingNote = await notesService.getNoteById(noteId, userId);
    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    await notesService.deleteNote(noteId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete note error:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
