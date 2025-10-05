import { db } from "./index";
import { users, prescriptions, type NewUser, type NewPrescription } from "./schema";
import { eq, desc } from "drizzle-orm";

// User operations
export async function createUser(userData: NewUser) {
  const [user] = await db.insert(users).values(userData).returning();
  return user;
}

export async function getUserById(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user;
}

export async function upsertUser(userData: NewUser) {
  const existingUser = await getUserById(userData.id);
  
  if (existingUser) {
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, userData.id))
      .returning();
    return updatedUser;
  }
  
  return createUser(userData);
}

// Prescription operations
export async function createPrescription(prescriptionData: NewPrescription) {
  const [prescription] = await db
    .insert(prescriptions)
    .values(prescriptionData)
    .returning();
  return prescription;
}

export async function getPrescriptionById(prescriptionId: string) {
  const [prescription] = await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.id, prescriptionId));
  return prescription;
}

export async function getPrescriptionsByUserId(
  userId: string,
  options?: { limit?: number; offset?: number }
) {
  const query = db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.userId, userId))
    .orderBy(desc(prescriptions.createdAt));

  if (options?.limit) {
    query.limit(options.limit);
  }

  if (options?.offset) {
    query.offset(options.offset);
  }

  return query;
}

export async function updatePrescription(
  prescriptionId: string,
  data: Partial<NewPrescription>
) {
  const [prescription] = await db
    .update(prescriptions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(prescriptions.id, prescriptionId))
    .returning();
  return prescription;
}

export async function deletePrescription(prescriptionId: string) {
  await db.delete(prescriptions).where(eq(prescriptions.id, prescriptionId));
}
