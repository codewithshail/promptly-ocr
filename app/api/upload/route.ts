import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { copyEvaluations } from "@/db/schema";
import { fileProcessingService } from "@/lib/services/file-processing.service";
import { inngest } from "@/lib/inngest/client";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const copyType = formData.get("copyType") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!copyType || !["gs", "essay"].includes(copyType)) {
      return NextResponse.json(
        { success: false, error: "Invalid copy type. Must be 'gs' or 'essay'" },
        { status: 400 }
      );
    }

    // Validate file type and size
    const validation = fileProcessingService.validateFile(file, 10);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Upload file to Cloudinary
    const uploadResult = await fileProcessingService.uploadFile(file, userId);

    // Create database record with status 'uploading'
    const [copyEvaluation] = await db
      .insert(copyEvaluations)
      .values({
        userId,
        fileName: file.name,
        fileUrl: uploadResult.url,
        copyType,
        status: "uploading",
      })
      .returning();

    // Trigger Inngest job for processing
    await inngest.send({
      name: "copy/uploaded",
      data: {
        copyId: copyEvaluation.id,
        fileUrl: uploadResult.url,
        fileType: file.type,
        copyType,
        userId,
      },
    });

    console.log("Copy uploaded successfully:", {
      copyId: copyEvaluation.id,
      fileName: file.name,
      copyType,
      url: uploadResult.url,
    });

    return NextResponse.json({
      success: true,
      copyId: copyEvaluation.id,
      url: uploadResult.url,
      status: "uploading",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}
