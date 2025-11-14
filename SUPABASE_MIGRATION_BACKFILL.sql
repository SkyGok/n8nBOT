-- ============================================
-- Migration & Backfill Script
-- Safely migrate existing data to new schema
-- Run AFTER SUPABASE_SCHEMA_UPDATE.sql
-- ============================================

-- ============================================
-- STEP 1: Backfill user_id for existing records
-- ============================================

-- IMPORTANT: Replace 'YOUR_DEFAULT_USER_ID' with an actual user UUID
-- You can get this from: SELECT id FROM public.users LIMIT 1;

-- Set a default user_id for existing calls (if you have a default user)
-- UPDATE public.calls 
-- SET user_id = 'YOUR_DEFAULT_USER_ID'::UUID
-- WHERE user_id IS NULL;

-- Set a default user_id for existing appointments
-- UPDATE public.appointments 
-- SET user_id = 'YOUR_DEFAULT_USER_ID'::UUID
-- WHERE user_id IS NULL;

-- Set a default user_id for existing engagement_metrics
-- UPDATE public.engagement_metrics 
-- SET user_id = 'YOUR_DEFAULT_USER_ID'::UUID
-- WHERE user_id IS NULL;

-- Set a default user_id for existing timeseries
-- UPDATE public.timeseries 
-- SET user_id = 'YOUR_DEFAULT_USER_ID'::UUID
-- WHERE user_id IS NULL;

-- Set a default user_id for existing status_summary
-- UPDATE public.status_summary 
-- SET user_id = 'YOUR_DEFAULT_USER_ID'::UUID
-- WHERE user_id IS NULL;

-- ============================================
-- STEP 2: Create customers from existing calls
-- ============================================

-- Extract unique customers from calls table
INSERT INTO public.customers (user_id, phone_number, full_name, created_at)
SELECT DISTINCT ON (c.user_id, c.phone_number)
  c.user_id,
  c.phone_number,
  MAX(c.contact_name) FILTER (WHERE c.contact_name IS NOT NULL) as full_name,
  MIN(c.created_at) as created_at
FROM public.calls c
WHERE c.user_id IS NOT NULL
  AND c.phone_number IS NOT NULL
GROUP BY c.user_id, c.phone_number
ON CONFLICT (user_id, phone_number) DO NOTHING;

-- ============================================
-- STEP 3: Link calls to customers
-- ============================================

-- Update calls.customer_id based on phone_number match
UPDATE public.calls c
SET customer_id = cust.id
FROM public.customers cust
WHERE c.phone_number = cust.phone_number
  AND c.user_id = cust.user_id
  AND c.customer_id IS NULL;

-- ============================================
-- STEP 4: Link appointments to calendar events (if applicable)
-- ============================================

-- If you have calendar event IDs in appointment metadata, you can link them:
-- UPDATE public.appointments a
-- SET calendar_event_id = ce.id
-- FROM public.calendar_events ce
-- WHERE a.metadata->>'google_event_id' = ce.google_event_id
--   AND a.calendar_event_id IS NULL;

-- ============================================
-- STEP 5: Verify migration
-- ============================================

-- Check for records without user_id (should be 0 after backfill)
SELECT 
  'calls' as table_name,
  COUNT(*) as records_without_user_id
FROM public.calls
WHERE user_id IS NULL
UNION ALL
SELECT 
  'appointments' as table_name,
  COUNT(*) as records_without_user_id
FROM public.appointments
WHERE user_id IS NULL
UNION ALL
SELECT 
  'engagement_metrics' as table_name,
  COUNT(*) as records_without_user_id
FROM public.engagement_metrics
WHERE user_id IS NULL
UNION ALL
SELECT 
  'timeseries' as table_name,
  COUNT(*) as records_without_user_id
FROM public.timeseries
WHERE user_id IS NULL
UNION ALL
SELECT 
  'status_summary' as table_name,
  COUNT(*) as records_without_user_id
FROM public.status_summary
WHERE user_id IS NULL;

-- Check customer creation
SELECT 
  COUNT(*) as total_customers,
  COUNT(DISTINCT user_id) as unique_users
FROM public.customers;

-- Check customer linking to calls
SELECT 
  COUNT(*) as total_calls,
  COUNT(customer_id) as calls_with_customer,
  ROUND(100.0 * COUNT(customer_id) / COUNT(*), 2) as percentage_linked
FROM public.calls;

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================

