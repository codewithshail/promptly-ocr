import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin";
import { db } from "@/db";
import { mockTests, mockTestAttempts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const tests = await db
      .select({
        id: mockTests.id,
        title: mockTests.title,
        description: mockTests.description,
        duration: mockTests.duration,
        totalQuestions: mockTests.totalQuestions,
        syllabus: mockTests.syllabus,
        questions: mockTests.questions,
        createdAt: mockTests.createdAt,
        attemptCount: sql<number>`count(${mockTestAttempts.id})`,
      })
      .from(mockTests)
      .leftJoin(mockTestAttempts, eq(mockTests.id, mockTestAttempts.testId))
      .groupBy(mockTests.id)
      .orderBy(sql`${mockTests.createdAt} DESC`);

    const formattedTests = tests.map((test) => ({
      ...test,
      syllabus: JSON.parse(test.syllabus || "[]"),
      questions: JSON.parse(test.questions || "[]"),
      _count: {
        attempts: Number(test.attemptCount || 0),
      },
    }));

    return NextResponse.json({ tests: formattedTests });
  } catch (error) {
    console.error("Error fetching mock tests:", error);
    return NextResponse.json(
      { error: "Failed to fetch mock tests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { title, description, duration, totalQuestions, syllabus, questions } =
      body;

    if (!title || !duration || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [test] = await db
      .insert(mockTests)
      .values({
        title,
        description: description || null,
        duration,
        totalQuestions,
        syllabus: JSON.stringify(syllabus || []),
        questions: JSON.stringify(questions),
      })
      .returning();

    return NextResponse.json({ test }, { status: 201 });
  } catch (error) {
    console.error("Error creating mock test:", error);
    return NextResponse.json(
      { error: "Failed to create mock test" },
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
        { error: "Test ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description, duration, totalQuestions, syllabus, questions } =
      body;

    const [test] = await db
      .update(mockTests)
      .set({
        title,
        description: description || null,
        duration,
        totalQuestions,
        syllabus: JSON.stringify(syllabus || []),
        questions: JSON.stringify(questions),
      })
      .where(eq(mockTests.id, id))
      .returning();

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    return NextResponse.json({ test });
  } catch (error) {
    console.error("Error updating mock test:", error);
    return NextResponse.json(
      { error: "Failed to update mock test" },
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
        { error: "Test ID is required" },
        { status: 400 }
      );
    }

    await db.delete(mockTests).where(eq(mockTests.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting mock test:", error);
    return NextResponse.json(
      { error: "Failed to delete mock test" },
      { status: 500 }
    );
  }
}
