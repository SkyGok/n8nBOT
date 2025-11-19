-- ============================================
-- SAMPLE THERAPISTS DATA
-- Insert sample therapists for demo purposes
-- Run this after running COMPLETE_DATABASE_SCHEMA.sql
-- ============================================

-- Clear existing therapists (optional - comment out if you want to keep existing data)
-- DELETE FROM public.therapists;

-- Insert sample therapists
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
) VALUES
-- Therapist 1: Lisa - Full-time, Monday-Friday
(
  'Lisa',
  'Anderson',
  'lisa.anderson@spa.com',
  '37120123456',
  'Aktif',
  ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  '09:00:00',
  '18:00:00',
  '13:00:00',
  '14:00:00',
  'Specializes in Swedish massage and aromatherapy. 5 years experience.'
),
-- Therapist 2: Oliver - Full-time, Monday-Saturday
(
  'Oliver',
  'Martinez',
  'oliver.martinez@spa.com',
  '37120123457',
  'Aktif',
  ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  '10:00:00',
  '19:00:00',
  '14:00:00',
  '15:00:00',
  'Expert in deep tissue massage and sports therapy. Certified in hot stone therapy.'
),
-- Therapist 3: Angelina - Part-time, Tuesday-Saturday
(
  'Angelina',
  'Petrov',
  'angelina.petrov@spa.com',
  '37120123458',
  'Aktif',
  ARRAY['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  '11:00:00',
  '20:00:00',
  NULL,
  NULL,
  'Specializes in reflexology and relaxation massage. Fluent in Russian and English.'
),
-- Therapist 4: Natalija - Full-time, Monday-Friday
(
  'Natalija',
  'Kozlova',
  'natalija.kozlova@spa.com',
  '37120123459',
  'Aktif',
  ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  '08:00:00',
  '17:00:00',
  '12:30:00',
  '13:30:00',
  'Early morning specialist. Expert in therapeutic massage and pain relief.'
),
-- Therapist 5: Luise - Part-time, Wednesday-Sunday
(
  'Luise',
  'Schmidt',
  'luise.schmidt@spa.com',
  '37120123460',
  'Aktif',
  ARRAY['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  '10:00:00',
  '18:00:00',
  '13:00:00',
  '14:00:00',
  'Weekend specialist. Fluent in German, English, and Latvian. Specializes in aromatherapy.'
),
-- Therapist 6: Maria - Full-time, Monday-Sunday (flexible)
(
  'Maria',
  'Garcia',
  'maria.garcia@spa.com',
  '37120123461',
  'Aktif',
  ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  '09:00:00',
  '18:00:00',
  '13:00:00',
  '14:00:00',
  'Available all week. Multi-lingual (Spanish, English, Latvian). General massage specialist.'
),
-- Therapist 7: Inactive therapist (for testing)
(
  'John',
  'Doe',
  'john.doe@spa.com',
  '37120123462',
  'Pasif',
  ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  '09:00:00',
  '17:00:00',
  NULL,
  NULL,
  'Currently on leave. Not available for bookings.'
);

-- Update working_hours and break_times columns (if trigger doesn't handle it automatically)
-- The trigger should handle this, but we'll update manually to ensure values are set
UPDATE public.therapists
SET 
  working_hours = CASE 
    WHEN working_hours_start IS NOT NULL AND working_hours_end IS NOT NULL 
    THEN TO_CHAR(working_hours_start, 'HH24:MI') || '-' || TO_CHAR(working_hours_end, 'HH24:MI')
    ELSE NULL
  END,
  break_times = CASE 
    WHEN break_start IS NOT NULL AND break_end IS NOT NULL 
    THEN TO_CHAR(break_start, 'HH24:MI') || '-' || TO_CHAR(break_end, 'HH24:MI')
    ELSE NULL
  END
WHERE working_hours IS NULL OR break_times IS NULL;

-- Verify the data
SELECT 
  id,
  first_name,
  last_name,
  name,
  full_name,
  status,
  working_days,
  working_hours,
  break_times,
  email,
  phone
FROM public.therapists
ORDER BY status DESC, first_name;

-- ============================================
-- SUMMARY
-- ============================================
-- Inserted 7 therapists:
-- - 6 Active (Aktif): Lisa, Oliver, Angelina, Natalija, Luise, Maria
-- - 1 Inactive (Pasif): John (for testing)
--
-- Working schedules:
-- - Lisa: Mon-Fri, 09:00-18:00, break 13:00-14:00
-- - Oliver: Mon-Sat, 10:00-19:00, break 14:00-15:00
-- - Angelina: Tue-Sat, 11:00-20:00, no break
-- - Natalija: Mon-Fri, 08:00-17:00, break 12:30-13:30
-- - Luise: Wed-Sun, 10:00-18:00, break 13:00-14:00
-- - Maria: Mon-Sun, 09:00-18:00, break 13:00-14:00
-- - John: Mon-Fri, 09:00-17:00 (inactive)
-- ============================================

