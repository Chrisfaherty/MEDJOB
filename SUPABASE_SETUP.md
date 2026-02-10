# Supabase Setup Guide for MedJob

This guide walks you through setting up Supabase for MedJob, including database schema, authentication, and RLS policies.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier is sufficient)
- Access to the MedJob codebase

## Step 1: Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in the details:
   - **Name:** `medjob` (or your preferred name)
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose **Ireland (eu-west-1)** for EU data residency
   - **Pricing Plan:** Free (sufficient for development and testing)
4. Click "Create new project"
5. Wait ~2 minutes for provisioning to complete

## Step 2: Run Database Schema

### Option A: Via Supabase Dashboard (Recommended)

1. In your Supabase project, navigate to **SQL Editor** in the left sidebar
2. Click "New Query"
3. Open `supabase/migrations/20260208_initial_schema.sql` from this repository
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click "Run" (or press `Cmd/Ctrl + Enter`)
7. Wait for execution to complete
8. Verify success: You should see "Success. No rows returned"

### Option B: Via Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Step 3: Verify Database Setup

1. Navigate to **Table Editor** in the Supabase dashboard
2. You should see 6 tables:
   - `jobs` - Job listings
   - `user_profiles` - User profiles
   - `user_applications` - Application tracking
   - `user_favorites` - Saved jobs
   - `user_preferences` - User settings
   - `scraping_logs` - Scraper activity logs

3. Click on `jobs` table and verify columns exist:
   - id, title, grade, specialty, scheme_type, hospital_name, etc.

4. Check RLS policies:
   - Go to **Authentication** > **Policies**
   - Each table should have multiple policies (e.g., "Anyone can view active jobs", "Admins can insert jobs")

## Step 4: Configure Authentication

1. Navigate to **Authentication** > **Providers** in the left sidebar

2. **Enable Email Provider:**
   - Toggle "Email" to ON
   - Enable "Confirm email" (recommended for production)

3. **Configure Email Templates:**
   - Go to **Authentication** > **Email Templates**
   - Customize templates for:
     - **Confirm signup** - Welcome email
     - **Reset password** - Password reset link
     - **Magic Link** - Passwordless login

   Example reset password template:
   ```html
   <h2>Reset Your Password</h2>
   <p>You requested to reset your password for MedJob.</p>
   <p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
   <p>If you didn't request this, please ignore this email.</p>
   ```

4. **Configure Site URL:**
   - Go to **Authentication** > **URL Configuration**
   - Set **Site URL:** `http://localhost:3000` (development) or `https://your-domain.com` (production)
   - Add **Redirect URLs:**
     - `http://localhost:3000/auth/callback`
     - `https://your-domain.com/auth/callback`

## Step 5: Get API Keys

1. Navigate to **Project Settings** > **API** in the left sidebar

2. Copy the following values:

   - **Project URL:** `https://your-project-id.supabase.co`
     → This goes in `NEXT_PUBLIC_SUPABASE_URL`

   - **anon/public key:** `eyJhbGci...` (long JWT token)
     → This goes in `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   - **service_role key:** `eyJhbGci...` (different JWT token)
     → This goes in `SUPABASE_SERVICE_ROLE_KEY`
     → ⚠️ **NEVER expose this in client-side code!**

## Step 6: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and fill in the values from Step 5:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_ADMIN_EMAILS=admin@medjob.ie,christopher.faherty@gmail.com
   ```

3. Save the file

## Step 7: Test the Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test authentication:**
   - Open [http://localhost:3000](http://localhost:3000)
   - Click "Login"
   - Try signing up with a test email
   - You should receive a confirmation email
   - Click the confirmation link
   - You should be logged in

3. **Test admin access:**
   - Sign up with `admin@medjob.ie` or `christopher.faherty@gmail.com`
   - Navigate to `/admin`
   - You should see the admin dashboard
   - Go to `/admin/users`
   - You should see the user management panel

4. **Test job scraping:**
   - While logged in as admin, navigate to `/admin`
   - Click "Start Scraping" under HSE scraper
   - Wait for scraping to complete
   - Navigate back to the dashboard
   - You should see scraped jobs appear

5. **Test data persistence:**
   - Favorite a job (click heart icon)
   - Mark a job as "Applied"
   - Close the browser
   - Open a new browser window and login
   - Your favorites and application status should persist

## Step 8: Verify RLS Policies Work

To ensure Row Level Security is working properly:

1. **Test as regular user:**
   - Sign up with a non-admin email (e.g., `test@example.com`)
   - Try to access `/admin` - Should be denied
   - Try to access `/admin/users` - Should redirect
   - Mark a job as applied
   - Open DevTools > Network tab
   - Verify the request to update application succeeds

2. **Test as admin:**
   - Sign up with `admin@medjob.ie`
   - Access `/admin` - Should work
   - Access `/admin/users` - Should show all users
   - Try to run the scraper - Should save jobs to database

3. **Test data isolation:**
   - Create two accounts: `user1@test.com` and `user2@test.com`
   - Log in as `user1@test.com`
   - Favorite Job A
   - Mark Job B as "Applied"
   - Log out and log in as `user2@test.com`
   - Verify you DON'T see user1's favorites or applications
   - Favorite Job C
   - Log back in as `user1@test.com`
   - Verify you still see Job A favorited and Job B as applied
   - Verify you DON'T see Job C favorited

## Troubleshooting

### Issue: "Failed to create user profile"

**Cause:** The `handle_new_user()` trigger isn't working

**Solution:**
1. Go to SQL Editor
2. Run this query to verify the trigger exists:
   ```sql
   SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
   ```
3. If missing, re-run the trigger creation from the schema file

### Issue: "RLS policy violation"

**Cause:** RLS policies are preventing access

**Solution:**
1. Go to **Authentication** > **Policies**
2. Verify policies exist for the table causing the error
3. Check if you're logged in (RLS requires authentication for most operations)
4. Verify your user's role matches the policy requirements

### Issue: "Invalid JWT"

**Cause:** Using the wrong Supabase key or expired token

**Solution:**
1. Verify `.env.local` has the correct keys from your Supabase project
2. Check that you're using `NEXT_PUBLIC_SUPABASE_ANON_KEY` (not service_role) in client code
3. Restart the dev server after changing environment variables

### Issue: Jobs not appearing after scraping

**Cause:** Scraper is failing or saving to localStorage instead of Supabase

**Solution:**
1. Check browser console for errors
2. Verify Supabase URL and keys are set in `.env.local`
3. Check Supabase logs in **Database** > **Logs**
4. Verify the `jobs` table exists and has the correct schema

### Issue: Email confirmation not working

**Cause:** Email provider not configured or incorrect redirect URL

**Solution:**
1. Check **Authentication** > **Email Templates** are configured
2. Verify **Site URL** and **Redirect URLs** are set correctly
3. Check spam folder for confirmation emails
4. For testing, disable email confirmation: **Authentication** > **Providers** > **Email** > Disable "Confirm email"

## Production Deployment

Before deploying to production:

1. **Update environment variables:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   NEXT_PUBLIC_ADMIN_EMAILS=admin@your-domain.com
   ```

2. **Configure custom domain (optional):**
   - Go to **Project Settings** > **Custom Domains**
   - Add your domain and follow DNS configuration steps

3. **Enable email confirmation:**
   - **Authentication** > **Providers** > **Email**
   - Enable "Confirm email"

4. **Set up database backups:**
   - **Database** > **Backups**
   - Enable daily automated backups
   - Consider point-in-time recovery (paid plans)

5. **Configure rate limiting:**
   - **Project Settings** > **API**
   - Set appropriate rate limits for your user base

6. **Enable database connection pooling:**
   - **Project Settings** > **Database**
   - Connection pooling is enabled by default

7. **Monitor performance:**
   - **Database** > **Logs** - Check for slow queries
   - **Observability** - Monitor API usage
   - Set up alerts for high CPU or memory usage

## Next Steps

- [ ] Test the application end-to-end
- [ ] Run the scraper to populate initial job data
- [ ] Invite team members to test
- [ ] Set up automated scraping (Vercel Cron or similar)
- [ ] Configure production environment variables
- [ ] Deploy to Vercel or your hosting platform

## Support

For issues or questions:
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Project Issues: https://github.com/your-repo/issues

## Security Checklist

- ✅ RLS policies enabled on all tables
- ✅ Service role key never exposed in client code
- ✅ Email verification required for sign-ups (production)
- ✅ Password complexity requirements met
- ✅ Rate limiting configured
- ✅ HTTPS enforced in production
- ✅ Environment variables properly secured
- ✅ Admin emails configured in database trigger
- ✅ JWT expiration set appropriately
- ✅ Database backups enabled
