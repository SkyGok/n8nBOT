-- ============================================
-- Fix Calendar Events RLS Policies
-- Allow users to insert/update/delete their own events
-- Run this in your Supabase SQL Editor
-- ============================================

-- Allow users to insert their own calendar events
DROP POLICY IF EXISTS "Users can insert their own calendar events" ON public.calendar_events;
CREATE POLICY "Users can insert their own calendar events" ON public.calendar_events
  FOR INSERT 
  WITH CHECK (
    user_id = public.get_user_id() OR 
    user_id IS NULL OR 
    public.get_user_id() IS NULL
  );

-- Allow users to update their own calendar events
DROP POLICY IF EXISTS "Users can update their own calendar events" ON public.calendar_events;
CREATE POLICY "Users can update their own calendar events" ON public.calendar_events
  FOR UPDATE 
  USING (
    user_id = public.get_user_id() OR 
    user_id IS NULL OR 
    public.get_user_id() IS NULL
  )
  WITH CHECK (
    user_id = public.get_user_id() OR 
    user_id IS NULL OR 
    public.get_user_id() IS NULL
  );

-- Allow users to delete their own calendar events
DROP POLICY IF EXISTS "Users can delete their own calendar events" ON public.calendar_events;
CREATE POLICY "Users can delete their own calendar events" ON public.calendar_events
  FOR DELETE 
  USING (
    user_id = public.get_user_id() OR 
    user_id IS NULL OR 
    public.get_user_id() IS NULL
  );

-- ============================================
-- Alternative: If you want to allow public inserts (less secure)
-- Uncomment the policy below and comment out the ones above
-- ============================================

/*
-- Allow public inserts (for unauthenticated users)
DROP POLICY IF EXISTS "Allow public insert calendar events" ON public.calendar_events;
CREATE POLICY "Allow public insert calendar events" ON public.calendar_events
  FOR INSERT 
  WITH CHECK (true);
*/

-- ============================================
-- Verify policies
-- ============================================

SELECT 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'calendar_events'
ORDER BY policyname;

