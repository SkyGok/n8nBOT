-- ============================================
-- CLEAR ALL DEMO DATA
-- This script deletes all data from all tables
-- Schema structure (tables, columns, indexes, triggers, functions) remains intact
-- Run this in Supabase SQL Editor to reset demo data
-- ============================================

-- ============================================
-- PART 1: DELETE DATA FROM TABLES WITH FOREIGN KEYS FIRST
-- Delete in reverse dependency order to avoid constraint violations
-- ============================================

-- Delete appointments first (references calendar_events, calls, users)
DELETE FROM public.appointments;

-- Delete calendar events (references appointments, users)
DELETE FROM public.calendar_events;

-- Delete calls (references customers, users)
DELETE FROM public.calls;

-- Delete WhatsApp messages (references users)
DELETE FROM public.whatsapp_messages;

-- Delete engagement metrics (references users)
DELETE FROM public.engagement_metrics;

-- Delete timeseries (references users)
DELETE FROM public.timeseries;

-- Delete status summary (references users)
DELETE FROM public.status_summary;

-- Delete customers (references users)
DELETE FROM public.customers;

-- Delete therapists (no foreign keys to other tables)
DELETE FROM public.therapists;

-- Delete users last (referenced by other tables)
DELETE FROM public.users;

-- ============================================
-- PART 2: RESET SEQUENCES (for SERIAL/BIGSERIAL columns)
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

