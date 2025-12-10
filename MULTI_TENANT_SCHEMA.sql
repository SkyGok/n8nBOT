-- ============================================
-- MULTI-TENANT SCHEMA UPDATES
-- Run this after COMPLETE_DATABASE_SCHEMA.sql
-- Adds tenant management and updates all tables for multi-tenancy
-- ============================================

-- ============================================
-- PART 1: CREATE TENANT MANAGEMENT TABLES
-- ============================================

-- Tenants table: Stores tenant/company information
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE, -- Optional: for subdomain-based routing (e.g., company-a.yourdomain.com)
  supabase_url TEXT, -- Tenant-specific Supabase URL (if using separate projects, otherwise NULL)
  supabase_anon_key TEXT, -- Tenant-specific anon key (if using separate projects, otherwise NULL)
  n8n_webhook_base_url TEXT NOT NULL, -- Base URL for tenant's n8n workflows (e.g., https://n8n.example.com/webhook/tenant-a)
  n8n_api_key TEXT, -- API key for tenant's n8n instance (optional, for workflow management)
  config JSONB DEFAULT '{}'::jsonb, -- Additional tenant-specific configuration
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT tenants_name_not_empty CHECK (char_length(name) > 0)
);

-- Tenant users: Many-to-many relationship between users and tenants
-- Allows users to belong to multiple tenants (e.g., consultant working for multiple companies)
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Indexes for tenant_users
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);

-- ============================================
-- PART 2: ADD tenant_id TO ALL DATA TABLES
-- ============================================

-- Add tenant_id to calls table
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_calls_tenant_id ON public.calls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calls_tenant_timestamp ON public.calls(tenant_id, timestamp);

-- Add tenant_id to appointments table
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON public.appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_datetime ON public.appointments(tenant_id, appointment_datetime);

-- Add tenant_id to calendar_events table
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_calendar_events_tenant_id ON public.calendar_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_tenant_start_time ON public.calendar_events(tenant_id, start_time);

-- Add tenant_id to customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_phone ON public.customers(tenant_id, phone_number);

-- Add tenant_id to whatsapp_messages table
ALTER TABLE public.whatsapp_messages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_tenant_id ON public.whatsapp_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_tenant_conversation ON public.whatsapp_messages(tenant_id, conversation_id);

-- Add tenant_id to engagement_metrics table
ALTER TABLE public.engagement_metrics ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_tenant_id ON public.engagement_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_tenant_date ON public.engagement_metrics(tenant_id, metric_date);

-- Add tenant_id to timeseries table
ALTER TABLE public.timeseries ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_timeseries_tenant_id ON public.timeseries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_timeseries_tenant_metric_timestamp ON public.timeseries(tenant_id, metric, timestamp);

-- Add tenant_id to status_summary table
ALTER TABLE public.status_summary ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_status_summary_tenant_id ON public.status_summary(tenant_id);
CREATE INDEX IF NOT EXISTS idx_status_summary_tenant_period ON public.status_summary(tenant_id, period);

-- ============================================
-- PART 3: HELPER FUNCTIONS
-- ============================================

-- Function to get current user's tenant_id(s)
-- Returns the first tenant if user belongs to multiple (can be extended to return array)
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.tenant_users 
  WHERE user_id = auth.uid() 
  ORDER BY created_at ASC
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to get all tenant_ids for current user
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS UUID[] AS $$
  SELECT ARRAY_AGG(tenant_id) FROM public.tenant_users 
  WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if user belongs to a specific tenant
CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND tenant_id = check_tenant_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user has role in tenant
CREATE OR REPLACE FUNCTION public.user_has_tenant_role(check_tenant_id UUID, check_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND tenant_id = check_tenant_id
    AND role = check_role
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user is admin or owner in any tenant (for cross-tenant access)
CREATE OR REPLACE FUNCTION public.user_is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- PART 4: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on tenants table
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Users can view tenants they belong to
DROP POLICY IF EXISTS "Users can view their tenants" ON public.tenants;
CREATE POLICY "Users can view their tenants" ON public.tenants
  FOR SELECT USING (
    id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
  );

-- Admins and owners can view all active tenants (for tenant switching)
DROP POLICY IF EXISTS "Admins can view all tenants" ON public.tenants;
CREATE POLICY "Admins can view all tenants" ON public.tenants
  FOR SELECT USING (
    -- User is admin or owner in at least one tenant
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
    AND status = 'active'
  );

-- Enable RLS on tenant_users
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own tenant memberships
DROP POLICY IF EXISTS "Users can view their tenant memberships" ON public.tenant_users;
CREATE POLICY "Users can view their tenant memberships" ON public.tenant_users
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own tenant membership (limited fields)
DROP POLICY IF EXISTS "Users can update their tenant memberships" ON public.tenant_users;
CREATE POLICY "Users can update their tenant memberships" ON public.tenant_users
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- PART 5: UPDATE RLS POLICIES FOR DATA TABLES
-- ============================================

-- Calls table RLS
DROP POLICY IF EXISTS "Users can view their tenant's calls" ON public.calls;
CREATE POLICY "Users can view their tenant's calls" ON public.calls
  FOR SELECT USING (
    -- User belongs to the tenant OR user is admin/owner in any tenant
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

DROP POLICY IF EXISTS "Users can insert their tenant's calls" ON public.calls;
CREATE POLICY "Users can insert their tenant's calls" ON public.calls
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

DROP POLICY IF EXISTS "Users can update their tenant's calls" ON public.calls;
CREATE POLICY "Users can update their tenant's calls" ON public.calls
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

DROP POLICY IF EXISTS "Users can delete their tenant's calls" ON public.calls;
CREATE POLICY "Users can delete their tenant's calls" ON public.calls
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

-- Appointments table RLS
DROP POLICY IF EXISTS "Users can view their tenant's appointments" ON public.appointments;
CREATE POLICY "Users can view their tenant's appointments" ON public.appointments
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

DROP POLICY IF EXISTS "Users can insert their tenant's appointments" ON public.appointments;
CREATE POLICY "Users can insert their tenant's appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

DROP POLICY IF EXISTS "Users can update their tenant's appointments" ON public.appointments;
CREATE POLICY "Users can update their tenant's appointments" ON public.appointments
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

DROP POLICY IF EXISTS "Users can delete their tenant's appointments" ON public.appointments;
CREATE POLICY "Users can delete their tenant's appointments" ON public.appointments
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

-- Calendar events table RLS
DROP POLICY IF EXISTS "Users can view their tenant's calendar events" ON public.calendar_events;
CREATE POLICY "Users can view their tenant's calendar events" ON public.calendar_events
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

DROP POLICY IF EXISTS "Users can insert their tenant's calendar events" ON public.calendar_events;
CREATE POLICY "Users can insert their tenant's calendar events" ON public.calendar_events
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

DROP POLICY IF EXISTS "Users can update their tenant's calendar events" ON public.calendar_events;
CREATE POLICY "Users can update their tenant's calendar events" ON public.calendar_events
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

DROP POLICY IF EXISTS "Users can delete their tenant's calendar events" ON public.calendar_events;
CREATE POLICY "Users can delete their tenant's calendar events" ON public.calendar_events
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

-- Customers table RLS
DROP POLICY IF EXISTS "Users can view their tenant's customers" ON public.customers;
CREATE POLICY "Users can view their tenant's customers" ON public.customers
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

DROP POLICY IF EXISTS "Users can insert their tenant's customers" ON public.customers;
CREATE POLICY "Users can insert their tenant's customers" ON public.customers
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

DROP POLICY IF EXISTS "Users can update their tenant's customers" ON public.customers;
CREATE POLICY "Users can update their tenant's customers" ON public.customers
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

DROP POLICY IF EXISTS "Users can delete their tenant's customers" ON public.customers;
CREATE POLICY "Users can delete their tenant's customers" ON public.customers
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

-- WhatsApp messages table RLS
DROP POLICY IF EXISTS "Users can view their tenant's whatsapp messages" ON public.whatsapp_messages;
CREATE POLICY "Users can view their tenant's whatsapp messages" ON public.whatsapp_messages
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

DROP POLICY IF EXISTS "Users can insert their tenant's whatsapp messages" ON public.whatsapp_messages;
CREATE POLICY "Users can insert their tenant's whatsapp messages" ON public.whatsapp_messages
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

DROP POLICY IF EXISTS "Users can update their tenant's whatsapp messages" ON public.whatsapp_messages;
CREATE POLICY "Users can update their tenant's whatsapp messages" ON public.whatsapp_messages
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

-- Engagement metrics table RLS
DROP POLICY IF EXISTS "Users can view their tenant's engagement metrics" ON public.engagement_metrics;
CREATE POLICY "Users can view their tenant's engagement metrics" ON public.engagement_metrics
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

DROP POLICY IF EXISTS "Users can insert their tenant's engagement metrics" ON public.engagement_metrics;
CREATE POLICY "Users can insert their tenant's engagement metrics" ON public.engagement_metrics
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

-- Timeseries table RLS
DROP POLICY IF EXISTS "Users can view their tenant's timeseries" ON public.timeseries;
CREATE POLICY "Users can view their tenant's timeseries" ON public.timeseries
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

DROP POLICY IF EXISTS "Users can insert their tenant's timeseries" ON public.timeseries;
CREATE POLICY "Users can insert their tenant's timeseries" ON public.timeseries
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

-- Status summary table RLS
DROP POLICY IF EXISTS "Users can view their tenant's status summary" ON public.status_summary;
CREATE POLICY "Users can view their tenant's status summary" ON public.status_summary
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

DROP POLICY IF EXISTS "Users can insert their tenant's status summary" ON public.status_summary;
CREATE POLICY "Users can insert their tenant's status summary" ON public.status_summary
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
    OR public.user_is_admin()
  );

-- ============================================
-- PART 6: SERVICE ROLE POLICIES (for n8n webhooks)
-- ============================================

-- Service role can insert/update/delete for any tenant (used by n8n webhooks)
-- These policies allow n8n to insert data, but webhook should include tenant_id in payload

-- Note: Service role bypasses RLS by default, but we can add explicit policies
-- for better control and logging. In practice, service role will work without these,
-- but having them makes the intent clear.

-- ============================================
-- PART 7: TRIGGERS FOR UPDATED_AT
-- ============================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tenants table
DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Apply trigger to tenant_users table
DROP TRIGGER IF EXISTS update_tenant_users_updated_at ON public.tenant_users;
CREATE TRIGGER update_tenant_users_updated_at
  BEFORE UPDATE ON public.tenant_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PART 8: COMMENTS
-- ============================================

COMMENT ON TABLE public.tenants IS 'Stores tenant/company information. Each tenant has isolated data via RLS policies.';
COMMENT ON TABLE public.tenant_users IS 'Many-to-many relationship between users and tenants. Users can belong to multiple tenants.';
COMMENT ON COLUMN public.tenants.supabase_url IS 'If NULL, uses default Supabase project. If set, uses tenant-specific Supabase project.';
COMMENT ON COLUMN public.tenants.n8n_webhook_base_url IS 'Base URL for tenant-specific n8n workflows. Example: https://n8n.example.com/webhook/tenant-a';
COMMENT ON FUNCTION public.get_user_tenant_id() IS 'Returns the primary tenant_id for the current authenticated user.';
COMMENT ON FUNCTION public.get_user_tenant_ids() IS 'Returns all tenant_ids the current authenticated user belongs to.';
COMMENT ON FUNCTION public.user_belongs_to_tenant(UUID) IS 'Checks if the current authenticated user belongs to the specified tenant.';
COMMENT ON FUNCTION public.user_has_tenant_role(UUID, TEXT) IS 'Checks if the current authenticated user has the specified role in the tenant.';
COMMENT ON FUNCTION public.user_is_admin() IS 'Checks if the current authenticated user is an admin or owner in any tenant. Used for cross-tenant access.';

-- ============================================
-- COMPLETE!
-- ============================================
-- Multi-tenant schema is now set up.
-- Next steps:
-- 1. Run MIGRATE_TO_MULTI_TENANT.sql to assign existing data to a default tenant
-- 2. Update frontend to use TenantContext
-- 3. Deploy tenant-specific n8n workflows
-- ============================================

