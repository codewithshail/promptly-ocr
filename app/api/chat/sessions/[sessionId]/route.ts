import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { chatService } from "@/lib/services/chat.service";
import { handleNetworkError, formatErrorForLogging } from "@/lib/error-handler";

/**
 * GET /api/chat/sessions/[sessionId]
 * Load a specific chat session
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;

    const session = await chatService.loadSession(userId, sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Load session error:", formatErrorForLogging(error));
    
    const errorResponse = handleNetworkError(error);
    
    return NextResponse.json(
      { 
        error: errorResponse.message,
        code: errorResponse.code 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat/sessions/[sessionId]
 * Delete a specific chat session
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;

    await chatService.deleteSession(userId, sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete session error:", formatErrorForLogging(error));
    
    const errorResponse = handleNetworkError(error);
    
    return NextResponse.json(
      { 
        error: errorResponse.message,
        code: errorResponse.code 
      },
      { status: 500 }
    );
  }
}
