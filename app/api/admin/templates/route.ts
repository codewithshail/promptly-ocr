import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin";
import { db } from "@/db";
import { answerTemplates } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const templates = await db
      .select()
      .from(answerTemplates)
      .orderBy(sql`${answerTemplates.createdAt} DESC`);

    const formattedTemplates = templates.map((template) => ({
      ...template,
      annotations: template.annotations
        ? JSON.parse(template.annotations)
        : [],
    }));

    return NextResponse.json({ templates: formattedTemplates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { questionType, title, structure, sampleAnswer, annotations } = body;

    if (!questionType || !title || !structure) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [template] = await db
      .insert(answerTemplates)
      .values({
        questionType,
        title,
        structure,
        sampleAnswer: sampleAnswer || "",
        annotations: JSON.stringify(annotations || []),
      })
      .returning();

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { questionType, title, structure, sampleAnswer, annotations } = body;

    const [template] = await db
      .update(answerTemplates)
      .set({
        questionType,
        title,
        structure,
        sampleAnswer: sampleAnswer || "",
        annotations: JSON.stringify(annotations || []),
      })
      .where(eq(answerTemplates.id, id))
      .returning();

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    await db.delete(answerTemplates).where(eq(answerTemplates.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
