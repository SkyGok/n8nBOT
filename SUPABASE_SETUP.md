# Supabase Integration Guide

This guide will help you connect the n8n Phone Analytics Dashboard to your Supabase database and deploy it online.

## 📋 Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project with the database tables created
3. Node.js 18+ installed
4. Git repository (for deployment)

## 🔧 Step 1: Get Supabase Credentials

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## 🔐 Step 2: Configure Environment Variables

1. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

2. Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_USE_SUPABASE=true
```

**⚠️ Important:** Never commit `.env` to Git! It's already in `.gitignore`.

## 🗄️ Step 3: Verify Database Tables

Make sure your Supabase database has these tables with the correct structure:

### Required Tables:

1. **`calls`** - Phone call records
2. **`appointments`** - Appointment records
3. **`engagement_metrics`** - Daily engagement metrics
4. **`timeseries`** - Time series data (optional, will calculate from calls if empty)
5. **`status_summary`** - Status summaries (optional)
6. **`users`** - User accounts

### Table Schema Verification

Run this SQL in your Supabase SQL Editor to verify your tables:

```sql
-- Check if all required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('calls', 'appointments', 'engagement_metrics', 'timeseries', 'status_summary', 'users');
```

## 🔒 Step 4: Configure Row Level Security (RLS)

For production, you should set up Row Level Security policies in Supabase:

1. Go to **Authentication** → **Policies** in Supabase
2. For each table, create policies that allow:
   - **SELECT** for authenticated users (or public if you want anonymous access)
   - **INSERT/UPDATE/DELETE** based on your requirements

Example policy for `calls` table (allow public read access):

```sql
-- Allow public read access to calls
CREATE POLICY "Allow public read access" ON public.calls
FOR SELECT
USING (true);
```

Or for authenticated users only:

```sql
-- Allow authenticated users to read calls
CREATE POLICY "Allow authenticated read access" ON public.calls
FOR SELECT
USING (auth.role() = 'authenticated');
```

## 🧪 Step 5: Test Locally

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open http://localhost:5173
4. Check the browser console for any Supabase connection errors
5. Verify that data is loading from your database

## 🚀 Step 6: Deploy to Production

### Option A: GitHub Pages (Free)

1. **Set up GitHub Secrets:**
   - Go to your GitHub repository
   - Navigate to **Settings** → **Secrets and variables** → **Actions**
   - Add these secrets:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

2. **Update GitHub Actions workflow:**
   The workflow file (`.github/workflows/deploy.yml`) needs to be updated to include environment variables during build.

3. **Update the workflow file** (see below)

4. **Push to GitHub:**
```bash
git add .
git commit -m "Add Supabase integration"
git push origin main
```

5. The GitHub Action will automatically build and deploy your site.

### Option B: Vercel (Recommended - Free)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel
```

3. **Add Environment Variables in Vercel Dashboard:**
   - Go to your project settings
   - Navigate to **Environment Variables**
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_USE_SUPABASE=true`

4. **Redeploy** after adding environment variables

### Option C: Netlify (Free)

1. **Install Netlify CLI:**
```bash
npm i -g netlify-cli
```

2. **Deploy:**
```bash
netlify deploy --prod
```

3. **Add Environment Variables:**
   - Go to Netlify dashboard → Site settings → Environment variables
   - Add the same variables as above

## 📝 Update GitHub Actions for Environment Variables

Update `.github/workflows/deploy.yml` to include environment variables:

```yaml
- name: Build
  run: npm run build
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
    VITE_USE_SUPABASE: 'true'
```

## 🔍 Troubleshooting

### Issue: "Missing Supabase environment variables"
**Solution:** Make sure `.env` file exists and contains valid credentials.

### Issue: "Failed to fetch data" errors
**Solutions:**
1. Check Supabase project is active
2. Verify RLS policies allow read access
3. Check browser console for specific error messages
4. Verify table names match exactly (case-sensitive)

### Issue: No data showing
**Solutions:**
1. Check if tables have data: Run `SELECT COUNT(*) FROM calls;` in Supabase SQL Editor
2. Verify column names match the schema
3. Check browser Network tab for API errors

### Issue: CORS errors
**Solution:** Supabase handles CORS automatically. If you see CORS errors, check:
- Supabase project URL is correct
- Anon key is correct
- RLS policies are configured

## 📊 Data Population

To populate your database with test data, you can use Supabase SQL Editor:

```sql
-- Example: Insert test call data
INSERT INTO public.calls (phone_number, direction, status, duration_seconds, timestamp)
VALUES 
  ('+1234567890', 'inbound', 'answered', 180, NOW()),
  ('+1234567891', 'outbound', 'answered', 240, NOW()),
  ('+1234567892', 'inbound', 'missed', 0, NOW());

-- Example: Insert engagement metrics
INSERT INTO public.engagement_metrics (metric_date, appointments_via_agent, whatsapp_conversations, whatsapp_appointments, notes_count_today)
VALUES (CURRENT_DATE, 25, 150, 18, 12);
```

## 🔄 Switching Between Mock and Real Data

- **Use Supabase:** Set `VITE_USE_SUPABASE=true` in `.env`
- **Use Mock Data:** Set `VITE_USE_SUPABASE=false` or remove the variable

The app will automatically detect which mode to use.

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

