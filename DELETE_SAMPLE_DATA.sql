-- ============================================
-- Delete All Sample Data from Supabase
-- Run this in your Supabase SQL Editor
-- 
-- WARNING: This will delete ALL sample/test data
-- Make sure you want to delete everything before running!
-- ============================================

-- ============================================
-- OPTION 1: Delete Sample Data Only (user_id IS NULL)
-- ============================================
-- This deletes only demo/sample data, keeping any real user data
-- Recommended if you have real data mixed with sample data

-- Delete in order to respect foreign key constraints
DELETE FROM public.calendar_events WHERE user_id IS NULL;
DELETE FROM public.appointments WHERE user_id IS NULL;
DELETE FROM public.whatsapp_messages WHERE user_id IS NULL;
DELETE FROM public.calls WHERE user_id IS NULL;
DELETE FROM public.customers WHERE user_id IS NULL;
DELETE FROM public.engagement_metrics WHERE user_id IS NULL;
DELETE FROM public.timeseries WHERE user_id IS NULL;
DELETE FROM public.status_summary WHERE user_id IS NULL;
-- Note: Projects tables (projects, project_sessions, production_updates, workers) are not part of this system

-- ============================================
-- OPTION 2: Delete ALL Data (Uncomment to use)
-- ============================================
-- WARNING: This deletes EVERYTHING from these tables!
-- Only use if you want to completely clear all data

/*
-- Delete in order to respect foreign key constraints
DELETE FROM public.calendar_events;
DELETE FROM public.appointments;
DELETE FROM public.whatsapp_messages;
DELETE FROM public.calls;
DELETE FROM public.customers;
DELETE FROM public.engagement_metrics;
DELETE FROM public.timeseries;
DELETE FROM public.status_summary;
*/

-- ============================================
-- OPTION 3: Delete Specific Tables Only
-- ============================================
-- Uncomment the tables you want to clear

/*
-- Delete calendar events only
DELETE FROM public.calendar_events WHERE user_id IS NULL;

-- Delete appointments only
DELETE FROM public.appointments WHERE user_id IS NULL;

-- Delete WhatsApp messages only
DELETE FROM public.whatsapp_messages WHERE user_id IS NULL;

-- Delete calls only
DELETE FROM public.calls WHERE user_id IS NULL;

-- Delete customers only
DELETE FROM public.customers WHERE user_id IS NULL;

-- Delete engagement metrics only
DELETE FROM public.engagement_metrics WHERE user_id IS NULL;

-- Delete timeseries data only
DELETE FROM public.timeseries WHERE user_id IS NULL;

-- Delete status summary only
DELETE FROM public.status_summary WHERE user_id IS NULL;
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after deletion to verify data is gone

-- Count remaining records (should be 0 for sample data)
SELECT 'customers' as table_name, COUNT(*) as remaining_count FROM public.customers WHERE user_id IS NULL
UNION ALL
SELECT 'calls', COUNT(*) FROM public.calls WHERE user_id IS NULL
UNION ALL
SELECT 'appointments', COUNT(*) FROM public.appointments WHERE user_id IS NULL
UNION ALL
SELECT 'whatsapp_messages', COUNT(*) FROM public.whatsapp_messages WHERE user_id IS NULL
UNION ALL
SELECT 'calendar_events', COUNT(*) FROM public.calendar_events WHERE user_id IS NULL
UNION ALL
SELECT 'engagement_metrics', COUNT(*) FROM public.engagement_metrics WHERE user_id IS NULL
UNION ALL
SELECT 'timeseries', COUNT(*) FROM public.timeseries WHERE user_id IS NULL
UNION ALL
SELECT 'status_summary', COUNT(*) FROM public.status_summary WHERE user_id IS NULL;
-- Note: Projects tables are not part of this phone analytics system

-- ============================================
-- RESET SEQUENCES (Optional)
-- ============================================
-- If you want to reset auto-increment IDs, uncomment these
-- Note: Only needed if you're deleting ALL data, not just sample data

/*
-- Reset sequences for tables with auto-increment IDs
-- (Adjust based on your actual sequence names)
ALTER SEQUENCE IF EXISTS public.engagement_metrics_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.status_summary_id_seq RESTART WITH 1;
*/

-- ============================================
-- Complete!
-- ============================================
-- All sample data has been deleted.
-- Run the verification queries above to confirm.
-- ============================================

