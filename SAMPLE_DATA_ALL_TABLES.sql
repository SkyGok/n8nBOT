-- ============================================
-- SAMPLE DATA FOR ALL TABLES
-- This script inserts one sample row into each table
-- Appointment created via WhatsApp message (no call)
-- Appointment scheduled for November 20th at 2:00 PM
-- Run this after running COMPLETE_DATABASE_SCHEMA.sql
-- ============================================

-- ============================================
-- PART 1: INSERT BASE DATA (no dependencies)
-- ============================================

-- 1. Insert a User
INSERT INTO public.users (
  email,
  full_name,
  role
) VALUES (
  'demo@example.com',
  'Demo User',
  'admin'
) ON CONFLICT (email) DO NOTHING
RETURNING id AS user_id;

-- Store user_id for later use (using a CTE approach)
DO $$
DECLARE
  v_user_id UUID;
  v_customer_id UUID;
  v_therapist_id UUID;
  v_calendar_event_id UUID;
  v_appointment_id UUID;
  v_appointment_datetime TIMESTAMPTZ;
BEGIN
  -- Set appointment datetime: November 21st at 2:00 PM (current year, or next year if date has passed)
  v_appointment_datetime := (
    CASE 
      WHEN DATE_TRUNC('year', NOW()) + INTERVAL '10 months' + INTERVAL '20 days' + INTERVAL '14 hours' > NOW()
      THEN DATE_TRUNC('year', NOW()) + INTERVAL '10 months' + INTERVAL '20 days' + INTERVAL '14 hours'
      ELSE DATE_TRUNC('year', NOW()) + INTERVAL '1 year' + INTERVAL '10 months' + INTERVAL '20 days' + INTERVAL '14 hours'
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
  -- PART 2: INSERT DEPENDENT DATA
  -- ============================================

  -- 2. Insert a Customer (references users)
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
    '+905551234567',
    'customer@example.com',
    'John Doe',
    'Acme Corporation',
    'Customer prefers WhatsApp communication. Booked appointment via WhatsApp conversation.',
    ARRAY['VIP', 'Regular', 'WhatsApp']
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_customer_id;
  
  -- If customer already exists, get its ID
  IF v_customer_id IS NULL THEN
    SELECT id INTO v_customer_id FROM public.customers 
    WHERE phone_number = '+905551234567' LIMIT 1;
  END IF;

  -- 3. Insert a Therapist (Oliver)
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
    'Oliver',
    'Martinez',
    'oliver.martinez@spa.com',
    '+905551234570',
    'Aktif',
    ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    '10:00:00',
    '19:00:00',
    '14:00:00',
    '15:00:00',
    'Expert in deep tissue massage and sports therapy. Certified in hot stone therapy.'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_therapist_id;
  
  -- If therapist already exists, get its ID
  IF v_therapist_id IS NULL THEN
    SELECT id INTO v_therapist_id FROM public.therapists 
    WHERE email = 'oliver.martinez@spa.com' LIMIT 1;
  END IF;

  -- 4. Insert a Calendar Event (references users)
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
    'whatsapp_appointment_12345',
    v_user_id,
    'Therapeutic Massage - John Doe - Oliver Martinez',
    'Therapeutic massage session for John Doe with therapist Oliver Martinez. Booked via WhatsApp.',
    'Spa Center - Room 1',
    v_appointment_datetime,
    v_appointment_datetime + INTERVAL '1 hour',
    false,
    'Europe/Istanbul',
    'confirmed',
    '[
      {"email": "customer@example.com", "name": "John Doe", "responseStatus": "accepted"},
      {"email": "oliver.martinez@spa.com", "name": "Oliver Martinez", "responseStatus": "accepted"}
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
    WHERE google_event_id = 'whatsapp_appointment_12345' LIMIT 1;
  END IF;

  -- 5. Insert an Appointment (references users, calendar_events, NO call - WhatsApp only)
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
    'whatsapp',
    v_appointment_datetime,
    v_user_id,
    NULL, -- No call, appointment created via WhatsApp
    'Confirmed',
    v_user_id,
    v_calendar_event_id,
    v_appointment_datetime,
    'John Doe',
    'customer@example.com',
    '+905551234567',
    'Therapeutic Massage',
    'Oliver Martinez',
    'Appointment booked via WhatsApp conversation. Customer requested November 21st at 2:00 PM. Confirmed via WhatsApp.',
    '{"source": "whatsapp", "booking_method": "whatsapp_message", "conversation_id": "conv_12345"}'::jsonb
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_appointment_id;
  
  -- If appointment already exists, get its ID
  IF v_appointment_id IS NULL THEN
    SELECT id INTO v_appointment_id FROM public.appointments 
    WHERE client_email = 'customer@example.com' 
    AND appointment_datetime > NOW()
    ORDER BY appointment_datetime ASC LIMIT 1;
  END IF;

  -- Update calendar_event with appointment_id (bidirectional relationship)
  IF v_appointment_id IS NOT NULL AND v_calendar_event_id IS NOT NULL THEN
    UPDATE public.calendar_events
    SET appointment_id = v_appointment_id
    WHERE id = v_calendar_event_id AND appointment_id IS NULL;
  END IF;

  -- 6. Insert WhatsApp Messages - Full Conversation (references users)
  -- Customer's first message
  INSERT INTO public.whatsapp_messages (
    user_id,
    conversation_id,
    message_id,
    phone_number,
    contact_name,
    direction,
    message_type,
    content,
    timestamp,
    status,
    metadata
  ) VALUES (
    v_user_id,
    'conv_12345',
    'msg_67890',
    '+905551234567',
    'John Doe',
    'inbound',
    'text',
    'Hello! I would like to book an appointment for a therapeutic massage.',
    v_appointment_datetime - INTERVAL '3 days' - INTERVAL '2 hours',
    'read',
    '{"platform": "whatsapp", "conversation_type": "booking"}'::jsonb
  )
  ON CONFLICT (message_id) DO NOTHING;

  -- Agent's response
  INSERT INTO public.whatsapp_messages (
    user_id,
    conversation_id,
    message_id,
    phone_number,
    contact_name,
    direction,
    message_type,
    content,
    timestamp,
    status,
    metadata
  ) VALUES (
    v_user_id,
    'conv_12345',
    'msg_67891',
    '+905551234567',
    'John Doe',
    'outbound',
    'text',
    'Hello! I would be happy to help you book a therapeutic massage. What date and time would work best for you?',
    v_appointment_datetime - INTERVAL '3 days' - INTERVAL '1 hour' - INTERVAL '45 minutes',
    'delivered',
    '{"platform": "whatsapp", "conversation_type": "booking"}'::jsonb
  )
  ON CONFLICT (message_id) DO NOTHING;

  -- Customer's response with date/time
  INSERT INTO public.whatsapp_messages (
    user_id,
    conversation_id,
    message_id,
    phone_number,
    contact_name,
    direction,
    message_type,
    content,
    timestamp,
    status,
    metadata
  ) VALUES (
    v_user_id,
    'conv_12345',
    'msg_67892',
    '+905551234567',
    'John Doe',
    'inbound',
    'text',
    'I would like to book for November 21st at 2:00 PM if that works.',
    v_appointment_datetime - INTERVAL '3 days' - INTERVAL '1 hour' - INTERVAL '30 minutes',
    'read',
      '{"platform": "whatsapp", "conversation_type": "booking", "requested_date": "2024-11-21", "requested_time": "14:00"}'::jsonb
  )
  ON CONFLICT (message_id) DO NOTHING;

  -- Agent's confirmation
  INSERT INTO public.whatsapp_messages (
    user_id,
    conversation_id,
    message_id,
    phone_number,
    contact_name,
    direction,
    message_type,
    content,
    timestamp,
    status,
    metadata
  ) VALUES (
    v_user_id,
    'conv_12345',
    'msg_67893',
    '+905551234567',
    'John Doe',
    'outbound',
    'text',
    'Perfect! I have booked your therapeutic massage appointment for November 21st at 2:00 PM with Oliver Martinez. You will receive a confirmation email shortly. See you then!',
    v_appointment_datetime - INTERVAL '3 days' - INTERVAL '1 hour' - INTERVAL '15 minutes',
    'delivered',
    '{"platform": "whatsapp", "conversation_type": "booking", "appointment_confirmed": true}'::jsonb
  )
  ON CONFLICT (message_id) DO NOTHING;

  -- Customer's thank you message
  INSERT INTO public.whatsapp_messages (
    user_id,
    conversation_id,
    message_id,
    phone_number,
    contact_name,
    direction,
    message_type,
    content,
    timestamp,
    status,
    metadata
  ) VALUES (
    v_user_id,
    'conv_12345',
    'msg_67894',
    '+905551234567',
    'John Doe',
    'inbound',
    'text',
    'Thank you so much! Looking forward to it.',
    v_appointment_datetime - INTERVAL '3 days' - INTERVAL '1 hour',
    'read',
    '{"platform": "whatsapp", "conversation_type": "booking"}'::jsonb
  )
  ON CONFLICT (message_id) DO NOTHING;

  -- 7. Insert Engagement Metrics (references users)
  INSERT INTO public.engagement_metrics (
    metric_date,
    appointments_via_agent,
    whatsapp_conversations,
    whatsapp_appointments,
    notes_count_today,
    user_id
  ) VALUES (
    CURRENT_DATE,
    1,
    1,
    1,
    1,
    v_user_id
  )
  ON CONFLICT DO NOTHING;

  -- 8. Insert Status Summary (references users)
  INSERT INTO public.status_summary (
    period,
    answered,
    missed,
    other,
    user_id
  ) VALUES (
    'today',
    1,
    0,
    0,
    v_user_id
  )
  ON CONFLICT DO NOTHING;

  -- 9. Insert Timeseries (references users)
  INSERT INTO public.timeseries (
    metric,
    timestamp,
    value,
    metadata,
    user_id
  ) VALUES (
    'calls_count',
    NOW(),
    1,
    '{"type": "daily", "source": "demo"}'::jsonb,
    v_user_id
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Sample data inserted successfully!';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Customer ID: %', v_customer_id;
  RAISE NOTICE 'Therapist ID: %', v_therapist_id;
  RAISE NOTICE 'Calendar Event ID: %', v_calendar_event_id;
  RAISE NOTICE 'Appointment ID: %', v_appointment_id;
  RAISE NOTICE 'Appointment DateTime: %', v_appointment_datetime;
  RAISE NOTICE 'Appointment created via WhatsApp (no call)';

END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check row counts for all tables
SELECT 
  'users' AS table_name, 
  COUNT(*) AS row_count 
FROM public.users
UNION ALL
SELECT 'customers', COUNT(*) FROM public.customers
UNION ALL
SELECT 'therapists', COUNT(*) FROM public.therapists
UNION ALL
SELECT 'calls', COUNT(*) FROM public.calls
UNION ALL
SELECT 'calendar_events', COUNT(*) FROM public.calendar_events
UNION ALL
SELECT 'appointments', COUNT(*) FROM public.appointments
UNION ALL
SELECT 'whatsapp_messages', COUNT(*) FROM public.whatsapp_messages
UNION ALL
SELECT 'engagement_metrics', COUNT(*) FROM public.engagement_metrics
UNION ALL
SELECT 'status_summary', COUNT(*) FROM public.status_summary
UNION ALL
SELECT 'timeseries', COUNT(*) FROM public.timeseries
ORDER BY table_name;

-- ============================================
-- COMPLETE!
-- ============================================
-- Sample data has been inserted into all tables.
-- Appointment created via WhatsApp conversation (no call).
-- Appointment scheduled for November 21st at 2:00 PM.
-- WhatsApp conversation includes 5 messages showing the booking flow.
-- ============================================

