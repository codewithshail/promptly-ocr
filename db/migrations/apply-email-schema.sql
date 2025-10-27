-- Apply email schema changes manually
-- This script adds the new email-related tables and columns

-- Create email_logs table if not exists
CREATE TABLE IF NOT EXISTS "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255),
	"email_type" varchar(50) NOT NULL,
	"recipient" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"status" varchar(20) NOT NULL,
	"resend_id" varchar(255),
	"error_message" text,
	"metadata" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);

-- Create announcements table if not exists
CREATE TABLE IF NOT EXISTS "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"target_audience" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"scheduled_for" timestamp,
	"sent_at" timestamp,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add notified_at column to copy_evaluations if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'copy_evaluations' AND column_name = 'notified_at'
    ) THEN
        ALTER TABLE "copy_evaluations" ADD COLUMN "notified_at" timestamp;
    END IF;
END $$;

-- Add email preference columns to user_preferences if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_preferences' AND column_name = 'email_welcome'
    ) THEN
        ALTER TABLE "user_preferences" ADD COLUMN "email_welcome" boolean DEFAULT true NOT NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_preferences' AND column_name = 'email_copy_complete'
    ) THEN
        ALTER TABLE "user_preferences" ADD COLUMN "email_copy_complete" boolean DEFAULT true NOT NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_preferences' AND column_name = 'email_daily_digest'
    ) THEN
        ALTER TABLE "user_preferences" ADD COLUMN "email_daily_digest" boolean DEFAULT true NOT NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_preferences' AND column_name = 'email_announcements'
    ) THEN
        ALTER TABLE "user_preferences" ADD COLUMN "email_announcements" boolean DEFAULT true NOT NULL;
    END IF;
END $$;

-- Add foreign key constraints if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'announcements_created_by_users_id_fk'
    ) THEN
        ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_id_fk" 
        FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'email_logs_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
