# Complete Deployment Guide

This guide will walk you through deploying the n8n Phone Analytics Dashboard with Supabase integration.

## 🚀 Quick Start Checklist

- [ ] Install dependencies
- [ ] Set up Supabase project
- [ ] Configure environment variables
- [ ] Test locally
- [ ] Deploy to production

## 📦 Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including `@supabase/supabase-js`.

## 🔧 Step 2: Supabase Setup

### 2.1 Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in project details:
   - **Name:** n8n-phone-analytics (or your preferred name)
   - **Database Password:** (save this securely)
   - **Region:** Choose closest to your users
4. Wait for project to be created (2-3 minutes)

### 2.2 Get API Credentials

1. In your Supabase project, go to **Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### 2.3 Create Database Tables

1. Go to **SQL Editor** in Supabase
2. Run your SQL schema to create all tables
3. Verify tables are created in **Table Editor**

### 2.4 Set Up Row Level Security (RLS)

For production, configure RLS policies. In SQL Editor, run:

```sql
-- Enable RLS on all tables
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeseries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_summary ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (adjust based on your security needs)
CREATE POLICY "Allow public read access to calls" ON public.calls
FOR SELECT USING (true);

CREATE POLICY "Allow public read access to appointments" ON public.appointments
FOR SELECT USING (true);

CREATE POLICY "Allow public read access to engagement_metrics" ON public.engagement_metrics
FOR SELECT USING (true);

CREATE POLICY "Allow public read access to timeseries" ON public.timeseries
FOR SELECT USING (true);

CREATE POLICY "Allow public read access to status_summary" ON public.status_summary
FOR SELECT USING (true);
```

**Note:** For production, consider using authenticated access instead of public access.

## 🔐 Step 3: Configure Environment Variables

### Local Development

1. Create `.env` file in project root:
```bash
cp .env.example .env
```

2. Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_USE_SUPABASE=true
```

3. **Never commit `.env` to Git!** (It's already in `.gitignore`)

### Production Deployment

#### Option A: GitHub Pages

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:
   - Name: `VITE_SUPABASE_URL`
   - Value: Your Supabase project URL
4. Add another secret:
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: Your Supabase anon key
5. Add optional secret:
   - Name: `VITE_USE_SUPABASE`
   - Value: `true`

The GitHub Actions workflow will automatically use these secrets during build.

#### Option B: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project directory
3. In Vercel dashboard → Project Settings → Environment Variables:
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`
   - Add `VITE_USE_SUPABASE` = `true`
4. Redeploy: `vercel --prod`

#### Option C: Netlify

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Run `netlify deploy --prod`
3. In Netlify dashboard → Site settings → Environment variables:
   - Add all three variables
4. Redeploy

## 🧪 Step 4: Test Locally

```bash
# Start development server
npm run dev
```

1. Open http://localhost:5173
2. Check browser console for errors
3. Verify data is loading from Supabase
4. Test all pages and features

## 📊 Step 5: Populate Test Data

In Supabase SQL Editor, run:

```sql
-- Insert sample calls
INSERT INTO public.calls (phone_number, contact_name, direction, status, duration_seconds, timestamp)
VALUES 
  ('+1234567890', 'John Doe', 'inbound', 'answered', 180, NOW() - INTERVAL '1 day'),
  ('+1234567891', 'Jane Smith', 'outbound', 'answered', 240, NOW() - INTERVAL '2 hours'),
  ('+1234567892', NULL, 'inbound', 'missed', 0, NOW() - INTERVAL '1 hour'),
  ('+1234567893', 'Bob Johnson', 'inbound', 'answered', 120, NOW() - INTERVAL '30 minutes');

-- Insert engagement metrics for today
INSERT INTO public.engagement_metrics (metric_date, appointments_via_agent, whatsapp_conversations, whatsapp_appointments, notes_count_today)
VALUES (CURRENT_DATE, 25, 150, 18, 12)
ON CONFLICT DO NOTHING;
```

## 🚀 Step 6: Deploy

### GitHub Pages Deployment

1. **Push code to GitHub:**
```bash
git add .
git commit -m "Add Supabase integration"
git push origin main
```

2. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: **GitHub Actions**
   - The workflow will automatically deploy

3. **Your site will be live at:**
   `https://yourusername.github.io/n8nBOT/`

### Vercel Deployment

```bash
vercel --prod
```

### Netlify Deployment

```bash
netlify deploy --prod
```

## 🔍 Verification Checklist

After deployment, verify:

- [ ] Dashboard loads without errors
- [ ] Summary cards show data
- [ ] Charts display correctly
- [ ] Events table loads and paginates
- [ ] Filters work (status, direction)
- [ ] All pages are accessible
- [ ] Mobile responsive design works
- [ ] No console errors

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
- Check `.env` file exists and has correct values
- For production, verify secrets are set in deployment platform

### "Failed to fetch" errors
- Verify Supabase project is active
- Check RLS policies allow read access
- Verify table names match exactly
- Check browser console for specific errors

### No data showing
- Verify tables have data: `SELECT COUNT(*) FROM calls;`
- Check column names match schema
- Verify RLS policies are correct

### Build fails in GitHub Actions
- Check secrets are set correctly
- Verify secret names match exactly (case-sensitive)
- Check build logs for specific errors

## 📝 Data Requirements Summary

Your Supabase database needs these tables populated:

1. **`calls`** - Phone call records (required)
2. **`engagement_metrics`** - Daily metrics (required)
3. **`timeseries`** - Optional (will calculate from calls if empty)
4. **`appointments`** - Optional (for future features)
5. **`users`** - Optional (for user management)

## 🔄 Switching Between Mock and Real Data

- **Use Supabase:** Set `VITE_USE_SUPABASE=true`
- **Use Mock Data:** Set `VITE_USE_SUPABASE=false` or remove variable

The app automatically detects which mode to use.

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Verify environment variables
4. Review RLS policies
5. Check network tab for failed requests

## 🎉 Success!

Once deployed, your dashboard will be live and connected to Supabase. Your client can start using it immediately!

