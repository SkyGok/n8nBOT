-- ============================================
-- CLEAR ALL DEMO DATA
-- This script deletes all data from all tables
-- Schema structure (tables, columns, indexes, triggers, functions) remains intact
-- Run this in Supabase SQL Editor to reset demo data
-- ============================================

-- ============================================
-- PART 1: TRUNCATE ALL TABLES
-- Using TRUNCATE with RESTART IDENTITY CASCADE for better performance
-- This will delete all data and reset sequences automatically
-- CASCADE handles all foreign key dependencies
-- ============================================

-- Truncate all tables at once (PostgreSQL handles dependencies automatically)
-- RESTART IDENTITY resets all sequences
-- CASCADE handles foreign key constraints
TRUNCATE TABLE 
  public.appointments,
  public.calendar_events,
  public.calls,
  public.whatsapp_messages,
  public.engagement_metrics,
  public.timeseries,
  public.status_summary,
  public.customers,
  public.therapists,
  public.users
RESTART IDENTITY CASCADE;

-- ============================================
-- PART 2: RESET SEQUENCES (for SERIAL/BIGSERIAL columns)
-- Note: TRUNCATE automatically resets sequences, but we'll do it explicitly for clarity
-- ============================================

-- Reset engagement_metrics sequence
ALTER SEQUENCE IF EXISTS public.engagement_metrics_id_seq RESTART WITH 1;

-- Reset timeseries sequence
ALTER SEQUENCE IF EXISTS public.timeseries_id_seq RESTART WITH 1;

-- Reset status_summary sequence
ALTER SEQUENCE IF EXISTS public.status_summary_id_seq RESTART WITH 1;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check that all tables are empty
SELECT 
  'appointments' AS table_name, 
  COUNT(*) AS row_count 
FROM public.appointments
UNION ALL
SELECT 'calendar_events', COUNT(*) FROM public.calendar_events
UNION ALL
SELECT 'calls', COUNT(*) FROM public.calls
UNION ALL
SELECT 'whatsapp_messages', COUNT(*) FROM public.whatsapp_messages
UNION ALL
SELECT 'engagement_metrics', COUNT(*) FROM public.engagement_metrics
UNION ALL
SELECT 'timeseries', COUNT(*) FROM public.timeseries
UNION ALL
SELECT 'status_summary', COUNT(*) FROM public.status_summary
UNION ALL
SELECT 'customers', COUNT(*) FROM public.customers
UNION ALL
SELECT 'therapists', COUNT(*) FROM public.therapists
UNION ALL
SELECT 'users', COUNT(*) FROM public.users
ORDER BY table_name;

-- ============================================
-- COMPLETE!
-- ============================================
-- All demo data has been cleared.
-- Schema structure (tables, columns, indexes, triggers, functions) remains intact.
-- You can now insert fresh demo data or start fresh.
-- ============================================

