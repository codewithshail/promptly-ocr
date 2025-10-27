import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Middleware to check if the current user is an admin
 * Returns the user if admin, otherwise returns an error response
 */
export async function requireAdmin() {
  const { userId } = await auth();

  if (!userId) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      ),
      user: null,
    };
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return {
        error: NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        ),
        user: null,
      };
    }

    if (!user.isAdmin) {
      return {
        error: NextResponse.json(
          { error: "Forbidden - Admin access required" },
          { status: 403 }
        ),
        user: null,
      };
    }

    return { error: null, user };
  } catch (error) {
    console.error("Error checking admin status:", error);
    return {
      error: NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      ),
      user: null,
    };
  }
}

/**
 * Check if a user is an admin by user ID
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const [user] = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user?.isAdmin || false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}
