# ✅ Next Steps - You're Almost There!

You've added your Supabase credentials. Here's what to do next:

## Step 1: Create Database Tables in Supabase (5 minutes)

1. **Go to your Supabase project:** https://app.supabase.com/project/awqgtfmyrewincxivqbd
2. **Click on "SQL Editor"** in the left sidebar
3. **Click "New Query"**
4. **Run your original SQL schema** (the CREATE TABLE statements you provided earlier)
   - If you don't have it, you can find it in your project files or recreate it
5. **After creating tables, run the setup script:**
   - Open the file `SUPABASE_SETUP.sql` in this project
   - Copy its contents
   - Paste into Supabase SQL Editor
   - Click "Run" (or press Ctrl+Enter)

This will:
- ✅ Enable Row Level Security (RLS)
- ✅ Create read access policies
- ✅ Add performance indexes
- ✅ Set up constraints

## Step 2: Add Sample Data (Optional - 2 minutes)

To test your dashboard, add some sample data:

1. **In Supabase SQL Editor**, run this:

```sql
-- Sample calls
INSERT INTO public.calls (phone_number, contact_name, direction, status, duration_seconds, timestamp, notes)
VALUES 
  ('+1234567890', 'John Doe', 'inbound', 'answered', 180, NOW() - INTERVAL '1 day', 'Customer inquiry'),
  ('+1234567891', 'Jane Smith', 'outbound', 'answered', 240, NOW() - INTERVAL '2 hours', 'Follow-up call'),
  ('+1234567892', NULL, 'inbound', 'missed', 0, NOW() - INTERVAL '1 hour', NULL),
  ('+1234567893', 'Bob Johnson', 'inbound', 'answered', 120, NOW() - INTERVAL '30 minutes', 'Appointment scheduled'),
  ('+1234567894', 'Alice Williams', 'outbound', 'voicemail', 0, NOW() - INTERVAL '15 minutes', 'Left voicemail'),
  ('+1234567895', 'Charlie Brown', 'inbound', 'answered', 300, NOW() - INTERVAL '10 minutes', 'Product inquiry'),
  ('+1234567896', NULL, 'inbound', 'missed', 0, NOW() - INTERVAL '5 minutes', NULL),
  ('+1234567897', 'Diana Prince', 'outbound', 'answered', 150, NOW(), 'Follow-up completed');

-- Today's engagement metrics
INSERT INTO public.engagement_metrics (metric_date, appointments_via_agent, whatsapp_conversations, whatsapp_appointments, notes_count_today)
VALUES (CURRENT_DATE, 25, 150, 18, 12)
ON CONFLICT (metric_date) DO UPDATE SET
  appointments_via_agent = EXCLUDED.appointments_via_agent,
  whatsapp_conversations = EXCLUDED.whatsapp_conversations,
  whatsapp_appointments = EXCLUDED.whatsapp_appointments,
  notes_count_today = EXCLUDED.notes_count_today,
  last_updated = NOW();
```

## Step 3: Test Locally (1 minute)

1. **Make sure your dev server is running:**
   ```bash
   npm run dev
   ```

2. **Open your browser:** http://localhost:5173

3. **Check the dashboard:**
   - ✅ Should show data in summary cards
   - ✅ Charts should display
   - ✅ Events table should show calls
   - ✅ No console errors

4. **If you see errors:**
   - Check browser console (F12)
   - Verify tables exist in Supabase Table Editor
   - Make sure RLS policies are set (Step 1)

## Step 4: Deploy to Production (5 minutes)

Once local testing works:

### 4.1 Add GitHub Secrets

1. Go to: https://github.com/skygok/n8nBOT/settings/secrets/actions
2. Click **"New repository secret"** and add:

   **Secret 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://awqgtfmyrewincxivqbd.supabase.co`

   **Secret 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3cWd0Zm15cmV3aW5jeGl2cWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NjMxNjYsImV4cCI6MjA3ODUzOTE2Nn0.-_BHiWiQwKf25tLhBFqc0eO1GiLko7U-Pt1Ut3WHb8U`

   **Secret 3:**
   - Name: `VITE_USE_SUPABASE`
   - Value: `true`

### 4.2 Enable GitHub Pages

1. Go to: https://github.com/skygok/n8nBOT/settings/pages
2. Under **Source**, select **"GitHub Actions"**
3. Click **Save**

### 4.3 Push and Deploy

```bash
git add .
git commit -m "Add Supabase integration and environment config"
git push origin main
```

### 4.4 Wait for Deployment

1. Go to: https://github.com/skygok/n8nBOT/actions
2. Watch the deployment workflow
3. When it shows ✅ (green checkmark), your site is live!

### 4.5 Access Your Live Site

Your dashboard will be available at:
**https://skygok.github.io/n8nBOT/**

---

## 🎯 Quick Checklist

- [ ] Created database tables in Supabase
- [ ] Ran SUPABASE_SETUP.sql script
- [ ] Added sample data (optional)
- [ ] Tested locally (`npm run dev` works)
- [ ] Added GitHub Secrets
- [ ] Enabled GitHub Pages
- [ ] Pushed code to GitHub
- [ ] Verified live site works

---

## 🐛 Troubleshooting

### "Failed to fetch" errors
- ✅ Check Supabase project is active (not paused)
- ✅ Verify RLS policies are set (run SUPABASE_SETUP.sql)
- ✅ Check browser console for specific errors
- ✅ Verify table names match exactly

### No data showing
- ✅ Run sample data SQL (Step 2)
- ✅ Check Supabase Table Editor - do you see data?
- ✅ Verify `metric_date` in `engagement_metrics` matches today's date

### Build fails
- ✅ Check all 3 GitHub secrets are set correctly
- ✅ Secret names must match exactly (case-sensitive)
- ✅ Check Actions tab for error details

---

## 🎉 You're Done!

Once all steps are complete, your dashboard is live and connected to Supabase!

Your client can access it at: **https://skygok.github.io/n8nBOT/**

