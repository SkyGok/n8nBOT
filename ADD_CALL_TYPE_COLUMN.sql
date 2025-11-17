-- ============================================
-- Add call_type column to calls table
-- This column will be used to distinguish between inbound and outbound calls
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Add call_type column (nullable first to allow data migration)
ALTER TABLE public.calls 
ADD COLUMN IF NOT EXISTS call_type TEXT;

-- Step 2: Migrate existing data from direction column to call_type
-- If direction column exists and has values, copy them to call_type
UPDATE public.calls 
SET call_type = LOWER(direction)
WHERE call_type IS NULL AND direction IS NOT NULL;

-- Step 3: Set default value for any remaining NULL values
-- Default to 'inbound' if no direction is specified
UPDATE public.calls 
SET call_type = 'inbound'
WHERE call_type IS NULL;

-- Step 4: Add CHECK constraint to ensure only 'inbound' or 'outbound' values
ALTER TABLE public.calls
DROP CONSTRAINT IF EXISTS calls_call_type_check;

ALTER TABLE public.calls
ADD CONSTRAINT calls_call_type_check 
CHECK (call_type IN ('inbound', 'outbound'));

-- Step 5: Make the column NOT NULL
ALTER TABLE public.calls
ALTER COLUMN call_type SET NOT NULL;

-- Step 6: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_calls_call_type ON public.calls(call_type);
CREATE INDEX IF NOT EXISTS idx_calls_call_type_timestamp ON public.calls(call_type, timestamp DESC);

-- Step 7: Add comment to document the column
COMMENT ON COLUMN public.calls.call_type IS 'Type of call: inbound (received) or outbound (made)';

-- ============================================
-- Verify the changes
-- ============================================

-- Check column exists and has correct constraint
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'calls' 
  AND column_name = 'call_type';

-- Check constraint exists
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'calls'
  AND tc.constraint_type = 'CHECK';

-- Count calls by type
SELECT call_type, COUNT(*) as count
FROM public.calls
GROUP BY call_type;

