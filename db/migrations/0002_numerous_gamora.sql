ALTER TABLE "notifications" ADD COLUMN "link" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "metadata" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "read" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "is_read";