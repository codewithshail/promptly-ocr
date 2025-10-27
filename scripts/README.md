# Admin Setup Scripts

## Creating the First Admin User

To create an admin user, follow these steps:

### Method 1: Using the Script (Recommended)

1. Make sure the user has signed up on the platform first
2. Run the script with the user's email:

```bash
npx tsx scripts/create-admin.ts user@example.com
```

3. Update the user's public metadata in Clerk Dashboard:
   - Go to Clerk Dashboard → Users
   - Find the user and click on them
   - Go to "Metadata" tab
   - Add to Public Metadata:
   ```json
   {
     "role": "admin"
   }
   ```

### Method 2: Direct Database Update

If you prefer to update the database directly:

```sql
UPDATE users SET is_admin = true WHERE email = 'user@example.com';
```

Then update Clerk metadata as described above.

### Method 3: Via Clerk Webhook

Set the user's public metadata in Clerk Dashboard first:
```json
{
  "role": "admin"
}
```

The webhook will automatically sync the admin status to the database on the next user update.

## Verifying Admin Access

After creating an admin user:

1. Sign in with the admin account
2. Navigate to `/admin` route
3. You should see the admin dashboard

If you get a 403 error, verify:
- The `is_admin` field is `true` in the database
- The Clerk public metadata has `"role": "admin"`
- Clear your browser cache and sign in again
