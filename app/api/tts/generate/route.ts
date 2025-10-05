import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getPrescriptionById } from "@/db/queries";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { prescriptionId } = body;

    if (!prescriptionId) {
      return NextResponse.json(
        { success: false, error: "Prescription ID is required" },
        { status: 400 }
      );
    }

    // Fetch prescription to verify ownership and get text
    const prescription = await getPrescriptionById(prescriptionId);

    if (!prescription) {
      return NextResponse.json(
        { success: false, error: "Prescription not found" },
        { status: 404 }
      );
    }

    if (prescription.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get the text to convert to speech (prefer relevant content, then enhanced, then extracted)
    const textToSpeak =
      prescription.relevantContent ||
      prescription.enhancedText ||
      prescription.extractedText;

    if (!textToSpeak) {
      return NextResponse.json(
        { success: false, error: "No text available for speech synthesis" },
        { status: 400 }
      );
    }

    // Return the text for client-side Web Speech API processing
    // We use client-side TTS because Web Speech API is browser-native
    // and doesn't require server-side audio generation
    return NextResponse.json({
      success: true,
      text: textToSpeak,
      prescriptionId,
    });
  } catch (error) {
    console.error("TTS generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to prepare text for speech synthesis",
      },
      { status: 500 }
    );
  }
}
