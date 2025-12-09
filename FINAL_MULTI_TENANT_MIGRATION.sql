-- ============================================
-- FINAL MULTI-TENANT MIGRATION
-- Complete implementation of Supabase multi-tenant isolation
-- Run this AFTER MULTI_TENANT_SCHEMA.sql and MIGRATE_TO_MULTI_TENANT.sql
-- ============================================

-- ============================================
-- PART 1: ADD tenant_id TO MISSING TABLES
-- ============================================

-- Add tenant_id to therapists table (was missing)
ALTER TABLE public.therapists 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_therapists_tenant_id ON public.therapists(tenant_id);
CREATE INDEX IF NOT EXISTS idx_therapists_tenant_status ON public.therapists(tenant_id, status);

-- ============================================
-- PART 2: UPDATE EXISTING DATA
-- ============================================

-- Assign all therapists to default tenant (if NULL)
DO $$
DECLARE
  v_default_tenant_id UUID;
BEGIN
  SELECT id INTO v_default_tenant_id 
  FROM public.tenants 
  WHERE name = 'Default Tenant' 
  LIMIT 1;
  
  IF v_default_tenant_id IS NOT NULL THEN
    UPDATE public.therapists
    SET tenant_id = v_default_tenant_id
    WHERE tenant_id IS NULL;
    
    RAISE NOTICE 'Assigned % therapists to default tenant', 
      (SELECT COUNT(*) FROM public.therapists WHERE tenant_id = v_default_tenant_id);
  END IF;
END $$;

-- ============================================
-- PART 3: CREATE EFFICIENT HELPER FUNCTIONS
-- ============================================

-- Function to get tenant_id from tenant_users table
-- Uses SECURITY DEFINER for performance and indexes for efficiency
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.tenant_users 
  WHERE user_id = auth.uid() 
  ORDER BY created_at ASC
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if user belongs to tenant
CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND tenant_id = check_tenant_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- PART 4: UPDATE RLS POLICIES TO USE JWT CLAIMS
-- ============================================

-- Enable RLS on therapists (if not already enabled)
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;

-- Drop old policies that use subqueries
DROP POLICY IF EXISTS "Users can view their tenant's therapists" ON public.therapists;
DROP POLICY IF EXISTS "Users can insert their tenant's therapists" ON public.therapists;
DROP POLICY IF EXISTS "Users can update their tenant's therapists" ON public.therapists;
DROP POLICY IF EXISTS "Users can delete their tenant's therapists" ON public.therapists;

-- Create new efficient policies using helper function
CREATE POLICY "Users can view their tenant's therapists" ON public.therapists
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Users can insert their tenant's therapists" ON public.therapists
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Users can update their tenant's therapists" ON public.therapists
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant_id()
  ) WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Users can delete their tenant's therapists" ON public.therapists
  FOR DELETE USING (
    tenant_id = public.get_user_tenant_id()
  );

-- Update calls table policies
DROP POLICY IF EXISTS "Users can view their tenant's calls" ON public.calls;
DROP POLICY IF EXISTS "Users can insert their tenant's calls" ON public.calls;
DROP POLICY IF EXISTS "Users can update their tenant's calls" ON public.calls;
DROP POLICY IF EXISTS "Users can delete their tenant's calls" ON public.calls;

CREATE POLICY "Users can view their tenant's calls" ON public.calls
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Users can insert their tenant's calls" ON public.calls
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Users can update their tenant's calls" ON public.calls
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant_id()
  ) WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Users can delete their tenant's calls" ON public.calls
  FOR DELETE USING (
    tenant_id = public.get_user_tenant_id()
  );

-- Update appointments table policies
DROP POLICY IF EXISTS "Users can view their tenant's appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert their tenant's appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their tenant's appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete their tenant's appointments" ON public.appointments;

CREATE POLICY "Users can view their tenant's appointments" ON public.appointments
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Users can insert their tenant's appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Users can update their tenant's appointments" ON public.appointments
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant_id()
  ) WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Users can delete their tenant's appointments" ON public.appointments
  FOR DELETE USING (
    tenant_id = public.get_user_tenant_id()
  );

-- Update calendar_events table policies
DROP POLICY IF EXISTS "Users can view their tenant's calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can insert their tenant's calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update their tenant's calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete their tenant's calendar events" ON public.calendar_events;

CREATE POLICY "Users can view their tenant's calendar events" ON public.calendar_events
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Users can insert their tenant's calendar events" ON public.calendar_events
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Users can update their tenant's calendar events" ON public.calendar_events
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant_id()
  ) WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Users can delete their tenant's calendar events" ON public.calendar_events
  FOR DELETE USING (
    tenant_id = public.get_user_tenant_id()
  );

-- Update customers table policies
DROP POLICY IF EXISTS "Users can view their tenant's customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert their tenant's customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update their tenant's customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete their tenant's customers" ON public.customers;

CREATE POLICY "Users can view their tenant's customers" ON public.customers
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Users can insert their tenant's customers" ON public.customers
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Users can update their tenant's customers" ON public.customers
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant_id()
  ) WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Users can delete their tenant's customers" ON public.customers
  FOR DELETE USING (
    tenant_id = public.get_user_tenant_id()
  );

-- Update whatsapp_messages table policies
DROP POLICY IF EXISTS "Users can view their tenant's whatsapp messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Users can insert their tenant's whatsapp messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Users can update their tenant's whatsapp messages" ON public.whatsapp_messages;

CREATE POLICY "Users can view their tenant's whatsapp messages" ON public.whatsapp_messages
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Users can insert their tenant's whatsapp messages" ON public.whatsapp_messages
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Users can update their tenant's whatsapp messages" ON public.whatsapp_messages
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant_id()
  ) WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

-- Update engagement_metrics table policies
DROP POLICY IF EXISTS "Users can view their tenant's engagement metrics" ON public.engagement_metrics;
DROP POLICY IF EXISTS "Users can insert their tenant's engagement metrics" ON public.engagement_metrics;

CREATE POLICY "Users can view their tenant's engagement metrics" ON public.engagement_metrics
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
  );

CREATE POLICY "Users can insert their tenant's engagement metrics" ON public.engagement_metrics
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
  );

-- Update timeseries table policies
DROP POLICY IF EXISTS "Users can view their tenant's timeseries" ON public.timeseries;
DROP POLICY IF EXISTS "Users can insert their tenant's timeseries" ON public.timeseries;

CREATE POLICY "Users can view their tenant's timeseries" ON public.timeseries
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Users can insert their tenant's timeseries" ON public.timeseries
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

-- Update status_summary table policies
DROP POLICY IF EXISTS "Users can view their tenant's status summary" ON public.status_summary;
DROP POLICY IF EXISTS "Users can insert their tenant's status summary" ON public.status_summary;

CREATE POLICY "Users can view their tenant's status summary" ON public.status_summary
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Users can insert their tenant's status summary" ON public.status_summary
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

-- ============================================
-- PART 5: MAKE tenant_id NOT NULL (AFTER DATA MIGRATION)
-- ============================================

-- Only run this AFTER all data has been migrated and verified
-- Uncomment these when ready to enforce NOT NULL constraints

/*
-- Make tenant_id NOT NULL on all tables
ALTER TABLE public.calls 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.appointments 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.calendar_events 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.customers 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.whatsapp_messages 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.engagement_metrics 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.timeseries 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.status_summary 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.therapists 
ALTER COLUMN tenant_id SET NOT NULL;
*/

-- ============================================
-- PART 6: CREATE TRIGGER TO AUTO-SET tenant_id ON INSERT
-- ============================================

-- Function to automatically set tenant_id from user's tenant on insert
CREATE OR REPLACE FUNCTION public.set_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set if not already provided
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.get_user_tenant_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tenant-scoped tables
DROP TRIGGER IF EXISTS trigger_set_tenant_id_calls ON public.calls;
CREATE TRIGGER trigger_set_tenant_id_calls
  BEFORE INSERT ON public.calls
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_id();

DROP TRIGGER IF EXISTS trigger_set_tenant_id_appointments ON public.appointments;
CREATE TRIGGER trigger_set_tenant_id_appointments
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_id();

DROP TRIGGER IF EXISTS trigger_set_tenant_id_calendar_events ON public.calendar_events;
CREATE TRIGGER trigger_set_tenant_id_calendar_events
  BEFORE INSERT ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_id();

DROP TRIGGER IF EXISTS trigger_set_tenant_id_customers ON public.customers;
CREATE TRIGGER trigger_set_tenant_id_customers
  BEFORE INSERT ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_id();

DROP TRIGGER IF EXISTS trigger_set_tenant_id_whatsapp_messages ON public.whatsapp_messages;
CREATE TRIGGER trigger_set_tenant_id_whatsapp_messages
  BEFORE INSERT ON public.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_id();

DROP TRIGGER IF EXISTS trigger_set_tenant_id_engagement_metrics ON public.engagement_metrics;
CREATE TRIGGER trigger_set_tenant_id_engagement_metrics
  BEFORE INSERT ON public.engagement_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_id();

DROP TRIGGER IF EXISTS trigger_set_tenant_id_timeseries ON public.timeseries;
CREATE TRIGGER trigger_set_tenant_id_timeseries
  BEFORE INSERT ON public.timeseries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_id();

DROP TRIGGER IF EXISTS trigger_set_tenant_id_status_summary ON public.status_summary;
CREATE TRIGGER trigger_set_tenant_id_status_summary
  BEFORE INSERT ON public.status_summary
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_id();

DROP TRIGGER IF EXISTS trigger_set_tenant_id_therapists ON public.therapists;
CREATE TRIGGER trigger_set_tenant_id_therapists
  BEFORE INSERT ON public.therapists
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_id();

-- ============================================
-- PART 7: COMMENTS
-- ============================================

COMMENT ON FUNCTION public.get_user_tenant_id() IS 'Returns tenant_id for the current authenticated user from tenant_users table. Used by RLS policies for tenant isolation.';
COMMENT ON FUNCTION public.set_tenant_id() IS 'Trigger function to automatically set tenant_id from user tenant on insert.';
COMMENT ON COLUMN public.therapists.tenant_id IS 'Tenant ID for multi-tenant isolation. Automatically set from JWT on insert.';

-- ============================================
-- COMPLETE!
-- ============================================
-- Next steps:
-- 1. Update frontend to use getTenantSupabase() in all service functions
-- 2. Update TenantContext to set tenant_id in JWT claims
-- 3. Test tenant isolation with multiple tenants
-- 4. After verification, uncomment NOT NULL constraints in PART 5
-- ============================================
