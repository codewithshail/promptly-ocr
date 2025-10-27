import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { userId } = params;

    const [user] = await db
      .update(users)
      .set({ isAdmin: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "User promoted to admin successfully",
      user,
    });
  } catch (error) {
    console.error("Error promoting user:", error);
    return NextResponse.json(
      { error: "Failed to promote user" },
      { status: 500 }
    );
  }
}
