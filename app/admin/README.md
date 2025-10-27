# Admin Dashboard

This directory contains the admin panel for the UPSC Aspirant Platform.

## Access

- **URL**: `/admin`
- **Authentication**: Requires admin privileges
- **Redirect**: Non-admin users are redirected to `/dashboard`

## Features

### Dashboard Home (`/admin`)
- Platform statistics overview
- Recent activity feed
- System health monitoring
- Quick action buttons

### Mock Tests (`/admin/mock-tests`)
- Create, edit, and delete mock tests
- Rich question editor with multiple choice options
- Syllabus topic management
- Preview functionality
- View attempt statistics

### Templates (`/admin/templates`)
- Create, edit, and delete answer templates
- Question type categorization
- Structure and sample answer editors
- Annotation system with keywords
- Preview functionality

### News Management (`/admin/news`)
- View all fetched news articles
- Search and filter by category
- Bulk delete operations
- View bookmark statistics
- Manual article creation (future)

### User Management (`/admin/users`)
- View all registered users
- Search by name or email
- View user statistics and activity
- Promote users to admin
- View detailed user profiles

### Announcements (`/admin/announcements`)
- Send platform-wide announcements (coming soon)

## Setup

### Creating an Admin User

1. User must sign up on the platform first
2. Run the promotion script:
   ```bash
   npx tsx scripts/create-admin.ts user@example.com
   ```
3. Update Clerk public metadata:
   ```json
   {
     "role": "admin"
   }
   ```

See `scripts/README.md` for detailed instructions.

## Architecture

### Layout
- `layout.tsx` - Admin layout with sidebar and authentication
- `admin-sidebar.tsx` - Navigation component

### Pages
Each feature has its own directory with:
- `page.tsx` - Server component with suspense
- `*-client.tsx` - Client component with state management

### API Routes
All admin APIs are under `/api/admin/`:
- `stats` - Dashboard statistics
- `mock-tests` - Mock test CRUD
- `templates` - Template CRUD
- `news` - News article CRUD
- `users` - User management

### Security
- All routes protected with `requireAdmin()` middleware
- Database-level admin check
- Clerk webhook syncs admin status

## Development

### Adding New Admin Features

1. Create page in `app/admin/[feature]/`
2. Create API route in `app/api/admin/[feature]/`
3. Add navigation item to `components/admin-sidebar.tsx`
4. Protect API with `requireAdmin()` middleware

### Styling
- Uses slate/amber color scheme
- Distinct from main platform design
- Responsive for all screen sizes

## Notes

- Admin status is stored in database `users.isAdmin` field
- Synced from Clerk public metadata via webhook
- All destructive actions require confirmation
- Toast notifications for user feedback
