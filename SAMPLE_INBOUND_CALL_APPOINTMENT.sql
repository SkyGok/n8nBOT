-- ============================================
-- SAMPLE DATA: INBOUND CALL RESULTING IN APPOINTMENT
-- This script creates an inbound call that resulted in an appointment
-- Appointment scheduled for November 21st at 3:00 PM
-- Run this after running COMPLETE_DATABASE_SCHEMA.sql
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_customer_id UUID;
  v_therapist_id UUID;
  v_call_id UUID;
  v_calendar_event_id UUID;
  v_appointment_id UUID;
  v_appointment_datetime TIMESTAMPTZ;
BEGIN
  -- Set appointment datetime: November 21st at 3:00 PM (current year, or next year if date has passed)
  v_appointment_datetime := (
    CASE 
      WHEN DATE_TRUNC('year', NOW()) + INTERVAL '10 months' + INTERVAL '20 days' + INTERVAL '15 hours' > NOW()
      THEN DATE_TRUNC('year', NOW()) + INTERVAL '10 months' + INTERVAL '20 days' + INTERVAL '15 hours'
      ELSE DATE_TRUNC('year', NOW()) + INTERVAL '1 year' + INTERVAL '10 months' + INTERVAL '20 days' + INTERVAL '15 hours'
    END
  );

  -- Get or create user
  SELECT id INTO v_user_id FROM public.users WHERE email = 'demo@example.com';
  
  IF v_user_id IS NULL THEN
    INSERT INTO public.users (email, full_name, role)
    VALUES ('demo@example.com', 'Demo User', 'admin')
    RETURNING id INTO v_user_id;
  END IF;

  -- ============================================
  -- PART 1: CREATE CUSTOMER
  -- ============================================
  INSERT INTO public.customers (
    user_id,
    phone_number,
    email,
    full_name,
    company,
    notes,
    tags
  ) VALUES (
    v_user_id,
    '+905551234569',
    'john.doe@example.com',
    'John Doe',
    'Tech Solutions Inc.',
    'Customer called to book an appointment. Prefers afternoon slots.',
    ARRAY['Regular', 'Afternoon']
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_customer_id;
  
  -- If customer already exists, get its ID
  IF v_customer_id IS NULL THEN
    SELECT id INTO v_customer_id FROM public.customers 
    WHERE phone_number = '+905551234569' LIMIT 1;
  END IF;

  -- ============================================
  -- PART 2: GET OR CREATE THERAPIST
  -- ============================================
  SELECT id INTO v_therapist_id FROM public.therapists 
  WHERE email = 'sarah.johnson@spa.com' LIMIT 1;
  
  -- If therapist doesn't exist, create one
  IF v_therapist_id IS NULL THEN
    INSERT INTO public.therapists (
      first_name,
      last_name,
      email,
      phone,
      status,
      working_days,
      working_hours_start,
      working_hours_end,
      break_start,
      break_end,
      notes
    ) VALUES (
      'Sarah',
      'Johnson',
      'sarah.johnson@spa.com',
      '+905551234568',
      'Aktif',
      ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      '09:00:00',
      '18:00:00',
      '13:00:00',
      '14:00:00',
      'Expert therapist with 8 years of experience in therapeutic massage'
    )
    RETURNING id INTO v_therapist_id;
  END IF;

  -- ============================================
  -- PART 3: CREATE INBOUND CALL
  -- ============================================
  INSERT INTO public.calls (
    phone_number,
    contact_name,
    direction,
    status,
    duration_seconds,
    timestamp,
    notes,
    user_id,
    customer_id,
    call_type
  ) VALUES (
    '+905551234569',
    'John Doe',
    'inbound',
    'answered',
    420, -- 7 minutes call
    v_appointment_datetime - INTERVAL '1 day' - INTERVAL '2 hours', -- Call happened 1 day and 2 hours before appointment
    'Customer called to book a therapeutic massage appointment. Requested November 21st at 3:00 PM. Confirmed availability and booked the appointment. Customer was friendly and asked about parking availability.',
    v_user_id,
    v_customer_id,
    'inbound'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_call_id;
  
  -- If call already exists, get its ID
  IF v_call_id IS NULL THEN
    SELECT id INTO v_call_id FROM public.calls 
    WHERE phone_number = '+905551234569' 
    AND timestamp > NOW() - INTERVAL '7 days'
    ORDER BY timestamp DESC LIMIT 1;
  END IF;

  -- ============================================
  -- PART 4: CREATE CALENDAR EVENT
  -- ============================================
  INSERT INTO public.calendar_events (
    google_event_id,
    user_id,
    title,
    description,
    location,
    start_time,
    end_time,
    all_day,
    timezone,
    status,
    attendees,
    reminders
  ) VALUES (
    'inbound_call_appointment_' || REPLACE(v_appointment_datetime::text, ' ', '_'),
    v_user_id,
    'Therapeutic Massage - John Doe - Sarah Johnson',
    'Therapeutic massage session for John Doe with therapist Sarah Johnson. Booked via inbound call.',
    'Spa Center - Room 2',
    v_appointment_datetime,
    v_appointment_datetime + INTERVAL '1 hour',
    false,
    'Europe/Istanbul',
    'confirmed',
    '[
      {"email": "john.doe@example.com", "name": "John Doe", "responseStatus": "accepted"},
      {"email": "sarah.johnson@spa.com", "name": "Sarah Johnson", "responseStatus": "accepted"}
    ]'::jsonb,
    '[
      {"method": "email", "minutes": 60},
      {"method": "popup", "minutes": 15}
    ]'::jsonb
  )
  ON CONFLICT (google_event_id) DO NOTHING
  RETURNING id INTO v_calendar_event_id;
  
  -- If calendar event already exists, get its ID
  IF v_calendar_event_id IS NULL THEN
    SELECT id INTO v_calendar_event_id FROM public.calendar_events 
    WHERE google_event_id = 'inbound_call_appointment_' || REPLACE(v_appointment_datetime::text, ' ', '_')
    LIMIT 1;
  END IF;

  -- ============================================
  -- PART 5: CREATE APPOINTMENT (LINKED TO CALL)
  -- ============================================
  INSERT INTO public.appointments (
    source,
    scheduled_at,
    created_by,
    call_id,
    status,
    user_id,
    calendar_event_id,
    appointment_datetime,
    client_name,
    client_email,
    client_phone,
    service_type,
    therapist_name,
    notes,
    metadata
  ) VALUES (
    'phone',
    v_appointment_datetime,
    v_user_id,
    v_call_id, -- Link to the inbound call
    'Confirmed',
    v_user_id,
    v_calendar_event_id,
    v_appointment_datetime,
    'John Doe',
    'john.doe@example.com',
    '+905551234569',
    'Therapeutic Massage',
    'Sarah Johnson',
    'Appointment booked via inbound call. Customer requested November 21st at 3:00 PM. Confirmed availability. Customer asked about parking - informed about free parking available.',
    jsonb_build_object(
      'source', 'phone',
      'booking_method', 'inbound_call',
      'call_id', v_call_id::text,
      'call_duration_seconds', 420
    )
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_appointment_id;
  
  -- If appointment already exists, get its ID
  IF v_appointment_id IS NULL THEN
    SELECT id INTO v_appointment_id FROM public.appointments 
    WHERE client_email = 'john.doe@example.com' 
    AND appointment_datetime = v_appointment_datetime
    LIMIT 1;
  END IF;

  -- Update calendar_event with appointment_id (bidirectional relationship)
  IF v_appointment_id IS NOT NULL AND v_calendar_event_id IS NOT NULL THEN
    UPDATE public.calendar_events
    SET appointment_id = v_appointment_id
    WHERE id = v_calendar_event_id AND appointment_id IS NULL;
  END IF;

  RAISE NOTICE 'Inbound call appointment created successfully!';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Customer ID: %', v_customer_id;
  RAISE NOTICE 'Therapist ID: %', v_therapist_id;
  RAISE NOTICE 'Call ID: %', v_call_id;
  RAISE NOTICE 'Calendar Event ID: %', v_calendar_event_id;
  RAISE NOTICE 'Appointment ID: %', v_appointment_id;
  RAISE NOTICE 'Appointment DateTime: %', v_appointment_datetime;
  RAISE NOTICE 'Appointment created from inbound call';

END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check the created call
SELECT 
  'Call Details' AS info_type,
  id,
  phone_number,
  contact_name,
  direction,
  status,
  duration_seconds,
  timestamp,
  notes
FROM public.calls
WHERE phone_number = '+905551234569'
ORDER BY timestamp DESC
LIMIT 1;

-- Check the created appointment
SELECT 
  'Appointment Details' AS info_type,
  id,
  source,
  appointment_datetime,
  client_name,
  client_email,
  client_phone,
  service_type,
  therapist_name,
  status,
  call_id,
  calendar_event_id,
  notes
FROM public.appointments
WHERE client_email = 'jane.smith@example.com'
ORDER BY appointment_datetime DESC
LIMIT 1;

-- Check the calendar event
SELECT 
  'Calendar Event Details' AS info_type,
  id,
  title,
  start_time,
  end_time,
  location,
  status,
  appointment_id
FROM public.calendar_events
WHERE title LIKE '%John Doe%'
ORDER BY start_time DESC
LIMIT 1;

-- ============================================
-- COMPLETE!
-- ============================================
-- Inbound call appointment has been created.
-- Call: Inbound call from John Doe
-- Appointment: November 21st at 3:00 PM
-- All records are properly linked (call -> appointment -> calendar_event)
-- ============================================

