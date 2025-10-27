import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { chatService } from "@/lib/services/chat.service";
import { handleNetworkError, formatErrorForLogging } from "@/lib/error-handler";

/**
 * GET /api/chat/sessions
 * Get all chat sessions for the authenticated user
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await chatService.getUserSessions(userId);

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Get sessions error:", formatErrorForLogging(error));
    
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
