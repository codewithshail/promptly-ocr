/**
 * Script to promote a user to admin
 * Usage: npx tsx scripts/create-admin.ts <user-email>
 * 
 * This script updates a user's isAdmin field to true in the database.
 * You can also set admin role in Clerk dashboard under user's public metadata:
 * { "role": "admin" }
 */

import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

async function createAdmin(email: string) {
  try {
    console.log(`Looking for user with email: ${email}`);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      console.log("\nMake sure the user has signed up first.");
      process.exit(1);
    }

    if (user.isAdmin) {
      console.log(`✅ User ${email} is already an admin`);
      process.exit(0);
    }

    await db
      .update(users)
      .set({ isAdmin: true, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    console.log(`✅ Successfully promoted ${email} to admin`);
    console.log(`\nUser ID: ${user.id}`);
    console.log(`Name: ${user.firstName} ${user.lastName}`);
    console.log("\n⚠️  Note: Also update the user's public metadata in Clerk dashboard:");
    console.log('   Set: { "role": "admin" }');
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
}

const email = process.argv[2];

if (!email) {
  console.error("❌ Please provide an email address");
  console.log("Usage: npx tsx scripts/create-admin.ts <user-email>");
  process.exit(1);
}

createAdmin(email);
