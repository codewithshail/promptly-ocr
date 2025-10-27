import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Placeholder OCR processing route
// This will be refactored in task 4.3 (Create shared file processing service)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        success: false,
        error: "OCR processing not yet implemented. This will be available in the unified copy checking system.",
      },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error in OCR processing endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process OCR request",
      },
      { status: 500 }
    );
  }
}
