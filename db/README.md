# Database Setup

## Schema Overview

This application uses Drizzle ORM with Neon DB (PostgreSQL). The schema includes:

### Tables

1. **users** - Stores user information synced from Clerk
   - `id` (varchar, primary key) - Clerk user ID
   - `email` (varchar, unique) - User email
   - `firstName` (varchar, nullable)
   - `lastName` (varchar, nullable)
   - `imageUrl` (text, nullable)
   - `createdAt` (timestamp)
   - `updatedAt` (timestamp)

2. **prescriptions** - Stores prescription uploads and OCR results
   - `id` (uuid, primary key)
   - `userId` (varchar, foreign key to users.id)
   - `fileName` (varchar)
   - `fileUrl` (text)
   - `fileSize` (integer)
   - `fileType` (varchar)
   - `extractedText` (text, nullable)
   - `status` (enum: uploading, processing, completed, failed)
   - `errorMessage` (text, nullable)
   - `createdAt` (timestamp)
   - `updatedAt` (timestamp)

## Setup Instructions

1. **Set up Neon DB:**
   - Create a new project at https://neon.tech
   - Copy the connection string
   - Add it to your `.env` file as `DATABASE_URL`

2. **Push schema to database:**
   ```bash
   npm run db:push
   ```
   This will create all tables and enums in your database without generating migration files.

3. **Set up Clerk Webhook:**
   - Go to Clerk Dashboard → Webhooks
   - Create a new webhook endpoint: `https://your-domain.com/api/webhooks/clerk`
   - Subscribe to events: `user.created` and `user.updated`
   - Copy the webhook secret and add it to `.env` as `CLERK_WEBHOOK_SECRET`

## User Synchronization

Users are automatically synced from Clerk to the database via webhooks:
- When a user signs up, the webhook creates a user record
- When a user updates their profile, the webhook updates the user record
- This prevents foreign key errors when creating prescriptions

## Available Scripts

- `npm run db:push` - Push schema changes to database (no migrations)
- `npm run db:studio` - Open Drizzle Studio to view/edit data
- `npm run db:generate` - Generate migration files (if needed)
- `npm run db:migrate` - Run migrations (if needed)

## Database Queries

All database operations are available in `db/queries.ts`:

### User Operations
- `createUser(userData)` - Create a new user
- `getUserById(userId)` - Get user by ID
- `upsertUser(userData)` - Create or update user

### Prescription Operations
- `createPrescription(data)` - Create a new prescription
- `getPrescriptionById(id)` - Get prescription by ID
- `getPrescriptionsByUserId(userId)` - Get all prescriptions for a user
- `updatePrescription(id, data)` - Update prescription
- `deletePrescription(id)` - Delete prescription
