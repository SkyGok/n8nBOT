-- ============================================
-- FIX MISSING CALENDAR EVENTS
-- Creates calendar_events for appointments that don't have them
-- Run this if n8n created appointments but calendar events are missing
-- ============================================

-- Step 1: Create calendar events for appointments without calendar_event_id
INSERT INTO public.calendar_events (
  google_event_id,
  title,
  description,
  start_time,
  end_time,
  status,
  appointment_id,
  metadata,
  timezone
)
SELECT 
  'appointment-' || a.id AS google_event_id,
  COALESCE(
    CASE 
      WHEN a.service_type IS NOT NULL AND a.client_name IS NOT NULL AND a.therapist_name IS NOT NULL
      THEN a.service_type || ' - ' || a.client_name || ' - ' || a.therapist_name
      WHEN a.service_type IS NOT NULL AND a.client_name IS NOT NULL
      THEN a.service_type || ' - ' || a.client_name
      WHEN a.client_name IS NOT NULL
      THEN 'Appointment - ' || a.client_name
      ELSE 'Appointment'
    END,
    'Appointment'
  ) AS title,
  a.notes AS description,
  COALESCE(a.appointment_datetime, a.scheduled_at) AS start_time,
  (COALESCE(a.appointment_datetime, a.scheduled_at) + INTERVAL '1 hour') AS end_time,
  CASE 
    WHEN a.status = 'Cancelled' THEN 'cancelled'
    ELSE 'confirmed'
  END AS status,
  a.id AS appointment_id,
  jsonb_build_object(
    'client_name', a.client_name,
    'client_email', a.client_email,
    'client_phone', a.client_phone,
    'service_type', a.service_type,
    'therapist_name', a.therapist_name,
    'source', a.source
  ) AS metadata,
  'Europe/Riga' AS timezone
FROM public.appointments a
WHERE a.calendar_event_id IS NULL
  AND a.status = 'Confirmed'
  AND (a.appointment_datetime IS NOT NULL OR a.scheduled_at IS NOT NULL)
ON CONFLICT (google_event_id) DO NOTHING;

-- Step 2: Update appointments with calendar_event_id
UPDATE public.appointments a
SET calendar_event_id = ce.id
FROM public.calendar_events ce
WHERE ce.appointment_id = a.id
  AND a.calendar_event_id IS NULL;

-- Step 3: Verify the fix
SELECT 
  'Appointments without calendar events' AS check_type,
  COUNT(*) AS count
FROM public.appointments
WHERE calendar_event_id IS NULL
  AND status = 'Confirmed'
  AND (appointment_datetime IS NOT NULL OR scheduled_at IS NOT NULL)

UNION ALL

SELECT 
  'Calendar events without appointments' AS check_type,
  COUNT(*) AS count
FROM public.calendar_events
WHERE appointment_id IS NULL

UNION ALL

SELECT 
  'Total appointments' AS check_type,
  COUNT(*) AS count
FROM public.appointments

UNION ALL

SELECT 
  'Total calendar events' AS check_type,
  COUNT(*) AS count
FROM public.calendar_events

UNION ALL

SELECT 
  'Linked appointments' AS check_type,
  COUNT(*) AS count
FROM public.appointments
WHERE calendar_event_id IS NOT NULL;

-- Step 4: Show recent appointments and their calendar events
SELECT 
  a.id AS appointment_id,
  a.client_name,
  a.client_email,
  a.service_type,
  a.therapist_name,
  a.scheduled_at,
  a.appointment_datetime,
  a.status AS appointment_status,
  a.calendar_event_id,
  ce.id AS calendar_event_id_check,
  ce.title AS calendar_event_title,
  ce.start_time AS calendar_start_time,
  ce.status AS calendar_status
FROM public.appointments a
LEFT JOIN public.calendar_events ce ON ce.appointment_id = a.id
ORDER BY a.created_at DESC
LIMIT 10;

-- ============================================
-- COMPLETE!
-- ============================================
-- If you see appointments without calendar_event_id, the fix above should have created them.
-- Refresh your website calendar to see the new events.
-- ============================================

