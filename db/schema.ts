import { pgTable, uuid, text, varchar, integer, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";

// Define the status enum for prescription processing states
export const prescriptionStatusEnum = pgEnum("prescription_status", [
  "uploading",
  "processing",
  "ai_enhancing",
  "classifying",
  "completed",
  "failed",
]);

// Users table - synced with Clerk authentication
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), // Clerk user ID
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Prescriptions table schema
export const prescriptions = pgTable("prescriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: varchar("file_type", { length: 100 }).notNull(),
  extractedText: text("extracted_text"),
  enhancedText: text("enhanced_text"),
  relevantContent: text("relevant_content"),
  irrelevantContent: text("irrelevant_content"),
  useAdvancedAI: boolean("use_advanced_ai").notNull().default(false),
  status: prescriptionStatusEnum("status").notNull().default("uploading"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// TypeScript type inference from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Prescription = typeof prescriptions.$inferSelect;
export type NewPrescription = typeof prescriptions.$inferInsert;
