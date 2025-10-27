import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq, and, desc, or, ilike } from "drizzle-orm";
import { geminiService } from "./gemini.service";

/**
 * AI help action types
 */
export type AIHelpAction =
  | "expand"
  | "summarize"
  | "add-examples"
  | "create-mnemonics"
  | "generate-questions"
  | "custom";

/**
 * AI help request structure
 */
export interface AIHelpRequest {
  noteId: string;
  action: AIHelpAction;
  customPrompt?: string;
}

/**
 * Note creation input
 */
export interface CreateNoteInput {
  title: string;
  content: string;
  sourceType?: "chat" | "news" | "tip" | "manual";
  sourceId?: string;
  tags?: string[];
  category?: string;
}

/**
 * NotesService - Service for managing notes with AI enhancement
 */
export class NotesService {
  /**
   * Create a new note
   * @param userId - User ID
   * @param noteData - Note data
   * @returns Created note
   */
  async createNote(userId: string, noteData: CreateNoteInput) {
    try {
      const result = await db
        .insert(notes)
        .values({
          userId,
          title: noteData.title,
          content: noteData.content,
          sourceType: noteData.sourceType,
          sourceId: noteData.sourceId,
          tags: noteData.tags ? JSON.stringify(noteData.tags) : null,
          category: noteData.category,
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error("Failed to create note:", error);
      throw new Error("Failed to create note");
    }
  }

  /**
   * Get note by ID
   * @param noteId - Note ID
   * @param userId - User ID (for authorization)
   * @returns Note or null
   */
  async getNoteById(noteId: string, userId: string) {
    try {
      const result = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error("Failed to get note:", error);
      throw new Error("Failed to get note");
    }
  }

  /**
   * Update note
   * @param noteId - Note ID
   * @param userId - User ID (for authorization)
   * @param updates - Fields to update
   * @returns Updated note
   */
  async updateNote(
    noteId: string,
    userId: string,
    updates: Partial<CreateNoteInput>
  ) {
    try {
      const updateData: Record<string, unknown> = {};

      if (updates.title) updateData.title = updates.title;
      if (updates.content) updateData.content = updates.content;
      if (updates.category) updateData.category = updates.category;
      if (updates.tags) updateData.tags = JSON.stringify(updates.tags);

      const result = await db
        .update(notes)
        .set(updateData)
        .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
        .returning();

      return result[0];
    } catch (error) {
      console.error("Failed to update note:", error);
      throw new Error("Failed to update note");
    }
  }

  /**
   * Delete note
   * @param noteId - Note ID
   * @param userId - User ID (for authorization)
   */
  async deleteNote(noteId: string, userId: string) {
    try {
      await db
        .delete(notes)
        .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
    } catch (error) {
      console.error("Failed to delete note:", error);
      throw new Error("Failed to delete note");
    }
  }

  /**
   * Get all notes for a user
   * @param userId - User ID
   * @param category - Optional category filter
   * @returns Array of notes
   */
  async getUserNotes(userId: string, category?: string) {
    try {
      const conditions = [eq(notes.userId, userId)];
      if (category) {
        conditions.push(eq(notes.category, category));
      }

      return await db
        .select()
        .from(notes)
        .where(and(...conditions))
        .orderBy(desc(notes.updatedAt));
    } catch (error) {
      console.error("Failed to get user notes:", error);
      throw new Error("Failed to get user notes");
    }
  }

  /**
   * Search notes by query
   * @param userId - User ID
   * @param query - Search query
   * @returns Array of matching notes
   */
  async searchNotes(userId: string, query: string) {
    try {
      return await db
        .select()
        .from(notes)
        .where(
          and(
            eq(notes.userId, userId),
            or(
              ilike(notes.title, `%${query}%`),
              ilike(notes.content, `%${query}%`)
            )
          )
        )
        .orderBy(desc(notes.updatedAt));
    } catch (error) {
      console.error("Failed to search notes:", error);
      throw new Error("Failed to search notes");
    }
  }

  /**
   * Get notes by category
   * @param userId - User ID
   * @param category - Category name
   * @returns Array of notes
   */
  async getNotesByCategory(userId: string, category: string) {
    try {
      return await db
        .select()
        .from(notes)
        .where(and(eq(notes.userId, userId), eq(notes.category, category)))
        .orderBy(desc(notes.updatedAt));
    } catch (error) {
      console.error("Failed to get notes by category:", error);
      throw new Error("Failed to get notes by category");
    }
  }

  /**
   * Enhance note with AI
   * @param noteId - Note ID
   * @param userId - User ID (for authorization)
   * @param request - AI help request
   * @returns Enhanced content
   */
  async enhanceNoteWithAI(
    noteId: string,
    userId: string,
    request: AIHelpRequest
  ): Promise<string> {
    try {
      // Get the note
      const note = await this.getNoteById(noteId, userId);
      if (!note) {
        throw new Error("Note not found");
      }

      // Build prompt based on action
      let prompt = "";

      switch (request.action) {
        case "expand":
          prompt = `You are a UPSC preparation assistant. Expand the following note with more detailed information, examples, and context relevant to UPSC preparation.

**Original Note**:
${note.content}

Provide expanded content that:
1. Adds more depth and detail
2. Includes relevant examples
3. Connects to UPSC syllabus topics
4. Maintains the original structure

Return only the expanded content, no additional commentary.`;
          break;

        case "summarize":
          prompt = `You are a UPSC preparation assistant. Summarize the following note into key points for quick revision.

**Original Note**:
${note.content}

Provide a concise summary that:
1. Captures all key points
2. Uses bullet points for clarity
3. Maintains UPSC relevance
4. Is easy to revise quickly

Return only the summary, no additional commentary.`;
          break;

        case "add-examples":
          prompt = `You are a UPSC preparation assistant. Add relevant examples to the following note.

**Original Note**:
${note.content}

Add examples that:
1. Are relevant to UPSC examination
2. Include recent case studies or events
3. Help illustrate key concepts
4. Are from Indian context where applicable

Return the note with examples added, no additional commentary.`;
          break;

        case "create-mnemonics":
          prompt = `You are a UPSC preparation assistant. Create mnemonics or memory aids for the following note.

**Original Note**:
${note.content}

Create mnemonics that:
1. Help remember key points
2. Are easy to recall
3. Use creative associations
4. Are relevant to the content

Return the note with mnemonics added, no additional commentary.`;
          break;

        case "generate-questions":
          prompt = `You are a UPSC preparation assistant. Generate practice questions based on the following note.

**Original Note**:
${note.content}

Generate questions that:
1. Test understanding of key concepts
2. Are in UPSC examination style
3. Include both factual and analytical questions
4. Cover different difficulty levels

Return the questions with answers, no additional commentary.`;
          break;

        case "custom":
          if (!request.customPrompt) {
            throw new Error("Custom prompt is required for custom action");
          }
          prompt = `You are a UPSC preparation assistant. ${request.customPrompt}

**Note Content**:
${note.content}

Return the enhanced content based on the request.`;
          break;

        default:
          throw new Error("Invalid AI help action");
      }

      // Get AI response
      const enhancedContent = await geminiService.chat(prompt, {
        enableWebSearch: false,
      });

      return enhancedContent;
    } catch (error) {
      console.error("Failed to enhance note with AI:", error);
      throw new Error("Failed to enhance note with AI");
    }
  }
}

// Export singleton instance
export const notesService = new NotesService();
