import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  createPrescription,
  getPrescriptionsByUserId,
  deletePrescription,
} from "@/db/queries";

// GET - Fetch user's prescriptions with pagination
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    // Parse and validate pagination parameters
    const paginationOptions = {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    // Validate that limit and offset are positive numbers if provided
    if (paginationOptions.limit && paginationOptions.limit < 1) {
      return NextResponse.json(
        { error: "Limit must be a positive number" },
        { status: 400 }
      );
    }

    if (paginationOptions.offset && paginationOptions.offset < 0) {
      return NextResponse.json(
        { error: "Offset must be a non-negative number" },
        { status: 400 }
      );
    }

    const prescriptions = await getPrescriptionsByUserId(userId, paginationOptions);

    return NextResponse.json(prescriptions);
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch prescriptions" },
      { status: 500 }
    );
  }
}

// POST - Create new prescription record
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fileName, fileUrl, fileSize, fileType, useAdvancedAI } = body;

    // Validate required fields
    if (!fileName || !fileUrl || !fileSize || !fileType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create prescription record with useAdvancedAI flag
    const prescription = await createPrescription({
      userId,
      fileName,
      fileUrl,
      fileSize,
      fileType,
      useAdvancedAI: useAdvancedAI ?? false,
      status: "uploading",
    });

    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return NextResponse.json(
      { error: "Failed to create prescription" },
      { status: 500 }
    );
  }
}

// DELETE - Remove prescription
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const prescriptionId = searchParams.get("id");

    if (!prescriptionId) {
      return NextResponse.json(
        { error: "Prescription ID is required" },
        { status: 400 }
      );
    }

    await deletePrescription(prescriptionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting prescription:", error);
    return NextResponse.json(
      { error: "Failed to delete prescription" },
      { status: 500 }
    );
  }
}
