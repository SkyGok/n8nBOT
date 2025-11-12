# 🚀 Quick Start Guide - Get Your Dashboard Live

Follow these steps to connect your dashboard to Supabase and deploy it online.

## Step 1: Set Up Supabase (5 minutes)

### 1.1 Create Supabase Project
1. Go to https://app.supabase.com
2. Click **"New Project"**
3. Fill in:
   - **Name:** `n8n-phone-analytics` (or any name)
   - **Database Password:** (save this securely!)
   - **Region:** Choose closest to you
4. Wait 2-3 minutes for project creation

### 1.2 Get Your API Keys
1. In your Supabase project, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### 1.3 Create Database Tables
1. Go to **SQL Editor** in Supabase
2. Click **"New Query"**
3. Paste and run your SQL schema (the CREATE TABLE statements you provided)
4. Verify tables are created: Go to **Table Editor** and check you see:
   - `calls`
   - `engagement_metrics`
   - `timeseries`
   - `appointments`
   - `status_summary`
   - `users`

### 1.4 Set Up Row Level Security (RLS)
1. In **SQL Editor**, run this query:

```sql
-- Enable RLS
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeseries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_summary ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for now - you can restrict later)
CREATE POLICY "Allow public read access to calls" ON public.calls
FOR SELECT USING (true);

CREATE POLICY "Allow public read access to engagement_metrics" ON public.engagement_metrics
FOR SELECT USING (true);

CREATE POLICY "Allow public read access to timeseries" ON public.timeseries
FOR SELECT USING (true);

CREATE POLICY "Allow public read access to appointments" ON public.appointments
FOR SELECT USING (true);

CREATE POLICY "Allow public read access to status_summary" ON public.status_summary
FOR SELECT USING (true);
```

### 1.5 Add Sample Data (Optional - for testing)
In **SQL Editor**, run:

```sql
-- Insert sample calls
INSERT INTO public.calls (phone_number, contact_name, direction, status, duration_seconds, timestamp, notes)
VALUES 
  ('+1234567890', 'John Doe', 'inbound', 'answered', 180, NOW() - INTERVAL '1 day', 'Customer inquiry'),
  ('+1234567891', 'Jane Smith', 'outbound', 'answered', 240, NOW() - INTERVAL '2 hours', 'Follow-up call'),
  ('+1234567892', NULL, 'inbound', 'missed', 0, NOW() - INTERVAL '1 hour', NULL),
  ('+1234567893', 'Bob Johnson', 'inbound', 'answered', 120, NOW() - INTERVAL '30 minutes', 'Appointment scheduled'),
  ('+1234567894', 'Alice Williams', 'outbound', 'voicemail', 0, NOW() - INTERVAL '15 minutes', 'Left voicemail');

-- Insert today's engagement metrics
INSERT INTO public.engagement_metrics (metric_date, appointments_via_agent, whatsapp_conversations, whatsapp_appointments, notes_count_today)
VALUES (CURRENT_DATE, 25, 150, 18, 12)
ON CONFLICT (metric_date) DO NOTHING;
```

**Note:** If you get an error about `metric_date` unique constraint, run this first:
```sql
ALTER TABLE public.engagement_metrics 
ADD CONSTRAINT engagement_metrics_metric_date_key UNIQUE (metric_date);
```

---

## Step 2: Configure Environment Variables (2 minutes)

### 2.1 Create Local `.env` File
1. In your project root (`/home/gokhan/Side-Projects/n8nBOT`), create a file named `.env`
2. Add these lines (replace with YOUR values from Step 1.2):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_USE_SUPABASE=true
```

**Important:** 
- Replace `your-project-id` with your actual Supabase project URL
- Replace `your_anon_key_here` with your actual anon key
- **Never commit this file to Git!** (It's already in `.gitignore`)

### 2.2 Test Locally
```bash
npm run dev
```

Open http://localhost:5173 and verify:
- ✅ Dashboard loads without errors
- ✅ Data appears in cards and charts
- ✅ No console errors

---

## Step 3: Deploy to GitHub Pages (5 minutes)

### 3.1 Set GitHub Secrets
1. Go to your GitHub repository: https://github.com/skygok/n8nBOT
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** and add:

   **Secret 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: Your Supabase project URL (same as in `.env`)

   **Secret 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: Your Supabase anon key (same as in `.env`)

   **Secret 3:**
   - Name: `VITE_USE_SUPABASE`
   - Value: `true`

### 3.2 Enable GitHub Pages
1. In your repository, go to **Settings** → **Pages**
2. Under **Source**, select **"GitHub Actions"**
3. Save

### 3.3 Push Your Code
```bash
git add .
git commit -m "Add Supabase integration and deployment config"
git push origin main
```

### 3.4 Wait for Deployment
1. Go to **Actions** tab in your repository
2. Watch the deployment workflow run
3. When it completes (green checkmark), your site is live!

### 3.5 Access Your Live Site
Your dashboard will be available at:
**https://skygok.github.io/n8nBOT/**

---

## Step 4: Verify Everything Works

### Check These:
- [ ] Dashboard page loads
- [ ] Summary cards show numbers (not zeros)
- [ ] Charts display data
- [ ] Events table shows call records
- [ ] WhatsApp page shows engagement metrics
- [ ] No console errors in browser
- [ ] Mobile view works (test on phone)

---

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
- ✅ Check `.env` file exists in project root
- ✅ Verify variable names are exactly: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_USE_SUPABASE`
- ✅ Restart dev server after creating `.env`

### "Failed to fetch" errors
- ✅ Check Supabase project is active (not paused)
- ✅ Verify RLS policies are set (Step 1.4)
- ✅ Check browser console for specific error messages
- ✅ Verify table names match exactly: `calls`, `engagement_metrics`, etc.

### No data showing
- ✅ Run sample data SQL (Step 1.5)
- ✅ Check Supabase Table Editor - do you see data?
- ✅ Verify `metric_date` in `engagement_metrics` matches today's date

### Build fails in GitHub Actions
- ✅ Check all 3 secrets are set correctly
- ✅ Secret names must match exactly (case-sensitive)
- ✅ Check Actions tab for error details

### Site shows "404" or blank page
- ✅ Wait 2-3 minutes after deployment
- ✅ Clear browser cache
- ✅ Check GitHub Pages settings (Source = GitHub Actions)
- ✅ Verify `vite.config.ts` has `base: '/n8nBOT/'` for production

---

## 📝 Next Steps After Deployment

1. **Connect n8n Workflows:**
   - Set up n8n workflows to insert data into Supabase
   - Use Supabase HTTP request node or Supabase node
   - Insert calls into `calls` table
   - Update `engagement_metrics` table daily

2. **Add Real Data:**
   - Replace sample data with real call records
   - Set up automated data insertion from your phone system

3. **Customize:**
   - Adjust colors in Tailwind config
   - Modify chart types if needed
   - Add more features as needed

---

## ✅ Success Checklist

- [ ] Supabase project created
- [ ] Tables created and verified
- [ ] RLS policies set
- [ ] Sample data inserted
- [ ] `.env` file created with correct values
- [ ] Local testing successful (`npm run dev` works)
- [ ] GitHub secrets configured
- [ ] Code pushed to GitHub
- [ ] GitHub Actions deployment successful
- [ ] Live site accessible and working

---

## 🎉 You're Done!

Once all steps are complete, your dashboard is live and connected to Supabase. Your client can access it at:
**https://skygok.github.io/n8nBOT/**

For detailed information, see:
- `DEPLOYMENT_GUIDE.md` - Full deployment instructions
- `DATABASE_REQUIREMENTS.md` - Database schema details
- `FEATURES_AND_DATA.md` - Complete feature list

