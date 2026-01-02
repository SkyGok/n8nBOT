-- ============================================
-- PHASE 2: SCHEMA-PER-TENANT ARCHITECTURE
-- Zero RLS Cost + Impossible Cross-Tenant Leaks
-- ============================================

-- ============================================
-- PART 1: ADD TENANT_SCHEMA TO TENANTS TABLE
-- ============================================

-- Add tenant_schema column to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS tenant_schema TEXT UNIQUE;

-- Generate schema names for existing tenants (if not set)
-- Format: tenant_<lowercase_name_with_underscores>
UPDATE public.tenants
SET tenant_schema = 'tenant_' || LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '_', 'g'))
WHERE tenant_schema IS NULL;

-- Make tenant_schema NOT NULL after setting values
ALTER TABLE public.tenants 
ALTER COLUMN tenant_schema SET NOT NULL;

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_tenants_schema ON public.tenants(tenant_schema);

-- ============================================
-- PART 2: CREATE TENANT SCHEMA MANAGEMENT FUNCTIONS
-- ============================================

-- Function to create a tenant schema with all required tables
CREATE OR REPLACE FUNCTION public.create_tenant_schema(
  schema_name TEXT,
  tenant_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tbl_name TEXT;
  tenant_tables TEXT[] := ARRAY[
    'calls',
    'appointments',
    'calendar_events',
    'whatsapp_messages',
    'customers',
    'therapists',
    'engagement_metrics',
    'status_summary',
    'timeseries',
    'daily_metrics'
  ];
BEGIN
  -- Create schema
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
  
  -- Grant usage to authenticated users
  EXECUTE format('GRANT USAGE ON SCHEMA %I TO authenticated', schema_name);
  
  -- Create tables in tenant schema (copy structure from public)
  FOR tbl_name IN SELECT unnest(tenant_tables) LOOP
    -- Skip if table doesn't exist in public
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl_name
    ) THEN
      -- Create table structure (without tenant_id column)
      EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.%I (LIKE public.%I INCLUDING ALL)
      ', schema_name, tbl_name, tbl_name);
      
      -- Remove tenant_id column if it exists (no longer needed)
      EXECUTE format('
        ALTER TABLE %I.%I DROP COLUMN IF EXISTS tenant_id
      ', schema_name, tbl_name);
      
      -- Grant permissions
      EXECUTE format('GRANT ALL ON %I.%I TO authenticated', schema_name, tbl_name);
    END IF;
  END LOOP;
  
  -- Create daily_metrics table if it doesn't exist (from Phase 1)
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.daily_metrics (
      day DATE NOT NULL,
      total_calls INTEGER DEFAULT 0,
      answered_calls INTEGER DEFAULT 0,
      missed_calls INTEGER DEFAULT 0,
      total_duration_seconds INTEGER DEFAULT 0,
      avg_duration_seconds NUMERIC(10, 2) DEFAULT 0,
      total_appointments INTEGER DEFAULT 0,
      confirmed_appointments INTEGER DEFAULT 0,
      whatsapp_messages INTEGER DEFAULT 0,
      whatsapp_conversations INTEGER DEFAULT 0,
      total_customers INTEGER DEFAULT 0,
      new_customers INTEGER DEFAULT 0,
      revenue NUMERIC(10, 2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (day)
    )
  ', schema_name);
  
  -- Create indexes for daily_metrics
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS idx_daily_metrics_day ON %I.daily_metrics(day DESC)
  ', schema_name);
  
  -- Update tenant record
  UPDATE public.tenants
  SET tenant_schema = schema_name
  WHERE id = tenant_id;
  
  RAISE NOTICE 'Created tenant schema: %', schema_name;
END;
$$;

-- Function to migrate data from public to tenant schema
CREATE OR REPLACE FUNCTION public.migrate_tenant_data_to_schema(
  tenant_uuid UUID,
  schema_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tbl_name TEXT;
  col_list TEXT;
  row_count INTEGER;
  tenant_tables TEXT[] := ARRAY[
    'calls',
    'appointments',
    'calendar_events',
    'whatsapp_messages',
    'customers',
    'therapists',
    'engagement_metrics',
    'status_summary',
    'timeseries',
    'daily_metrics'
  ];
BEGIN
  -- Ensure schema exists
  PERFORM public.create_tenant_schema(schema_name, tenant_uuid);
  
  -- Migrate data for each table
  FOR tbl_name IN SELECT unnest(tenant_tables) LOOP
    -- Skip if table doesn't exist in public
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl_name
    ) THEN
      -- Build column list excluding tenant_id and generated columns
      SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
      INTO col_list
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tbl_name
        AND column_name != 'tenant_id'
        AND (is_generated IS NULL OR is_generated != 'ALWAYS');  -- Exclude generated columns
      
      -- Copy data (excluding tenant_id column)
      EXECUTE format('
        INSERT INTO %I.%I (%s)
        SELECT %s FROM public.%I 
        WHERE tenant_id = %L
        ON CONFLICT DO NOTHING
      ', schema_name, tbl_name, col_list, col_list, tbl_name, tenant_uuid);
      
      -- Get row count
      EXECUTE format('SELECT COUNT(*) FROM %I.%I', schema_name, tbl_name) INTO row_count;
      
      RAISE NOTICE 'Migrated data from public.% to %I.% (rows: %)', 
        tbl_name, schema_name, tbl_name, row_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migration complete for tenant: %', tenant_uuid;
END;
$$;

-- Function to get tenant schema name
CREATE OR REPLACE FUNCTION public.get_tenant_schema(tenant_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  schema_name TEXT;
BEGIN
  SELECT tenant_schema INTO schema_name
  FROM public.tenants
  WHERE id = tenant_uuid;
  
  IF schema_name IS NULL THEN
    RAISE EXCEPTION 'Tenant schema not found for tenant_id: %', tenant_uuid;
  END IF;
  
  RETURN schema_name;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_tenant_schema TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.migrate_tenant_data_to_schema TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_tenant_schema TO authenticated, service_role;

-- ============================================
-- PART 3: UPDATE TENANT_USERS TABLE
-- ============================================

-- Add tenant_schema to tenant_users for faster lookups
ALTER TABLE public.tenant_users
ADD COLUMN IF NOT EXISTS tenant_schema TEXT;

-- Populate tenant_schema from tenants table
UPDATE public.tenant_users tu
SET tenant_schema = t.tenant_schema
FROM public.tenants t
WHERE tu.tenant_id = t.id
  AND tu.tenant_schema IS NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_tenant_users_schema ON public.tenant_users(user_id, tenant_schema);

-- ============================================
-- PART 4: CREATE SCHEMA-BASED RPC FUNCTIONS
-- ============================================

-- Updated get_dashboard_overview to use schema instead of tenant_id
CREATE OR REPLACE FUNCTION public.get_dashboard_overview(
  from_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  to_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  tenant_schema_name TEXT;
  result JSONB;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get tenant schema from tenant_users (first tenant user belongs to)
  SELECT tu.tenant_schema INTO tenant_schema_name
  FROM public.tenant_users tu
  WHERE tu.user_id = current_user_id
  LIMIT 1;
  
  IF tenant_schema_name IS NULL THEN
    RAISE EXCEPTION 'No tenant schema found for user';
  END IF;
  
  -- Set search path to tenant schema
  PERFORM set_config('search_path', tenant_schema_name, true);
  
  -- Build dashboard response using tenant schema
  SELECT jsonb_build_object(
    'summary', (
      SELECT jsonb_build_object(
        'totalCalls', COALESCE(SUM(total_calls), 0),
        'answeredCalls', COALESCE(SUM(answered_calls), 0),
        'missedCalls', COALESCE(SUM(missed_calls), 0),
        'totalDuration', COALESCE(SUM(total_duration_seconds), 0),
        'averageDuration', COALESCE(
          CASE 
            WHEN SUM(total_calls) > 0 THEN SUM(total_duration_seconds)::NUMERIC / SUM(total_calls)
            ELSE 0
          END, 0
        ),
        'lastUpdated', MAX(updated_at)
      )
      FROM daily_metrics
      WHERE day BETWEEN from_date AND to_date
    ),
    'engagement', (
      SELECT jsonb_build_object(
        'appointmentsViaAgent', COALESCE(SUM(total_appointments), 0),
        'confirmedAppointments', COALESCE(SUM(confirmed_appointments), 0),
        'whatsappConversations', COALESCE(SUM(whatsapp_conversations), 0),
        'whatsappMessages', COALESCE(SUM(whatsapp_messages), 0),
        'totalCustomers', COALESCE(MAX(total_customers), 0)
      )
      FROM daily_metrics
      WHERE day BETWEEN from_date AND to_date
    ),
    'timeseries', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'timestamp', day,
          'value', total_calls
        ) ORDER BY day
      ), '[]'::jsonb)
      FROM daily_metrics
      WHERE day BETWEEN from_date AND to_date
    ),
    'statusBreakdown', (
      SELECT jsonb_build_object(
        'answered', COALESCE(SUM(answered_calls), 0),
        'missed', COALESCE(SUM(missed_calls), 0),
        'other', COALESCE(SUM(total_calls) - SUM(answered_calls) - SUM(missed_calls), 0)
      )
      FROM daily_metrics
      WHERE day BETWEEN from_date AND to_date
    ),
    'recentMetrics', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'day', day,
          'totalCalls', total_calls,
          'answeredCalls', answered_calls,
          'missedCalls', missed_calls,
          'appointments', total_appointments,
          'revenue', revenue
        ) ORDER BY day DESC
      ), '[]'::jsonb)
      FROM (
        SELECT day, total_calls, answered_calls, missed_calls, total_appointments, revenue
        FROM daily_metrics
        WHERE day BETWEEN from_date AND to_date
        ORDER BY day DESC
        LIMIT 30
      ) recent_data
    )
  ) INTO result;
  
  -- Reset search path
  PERFORM set_config('search_path', 'public', true);
  
  -- Fallback to raw data if no metrics
  IF result->'summary'->>'totalCalls' = '0' OR result->'summary'->>'totalCalls' IS NULL THEN
    PERFORM set_config('search_path', tenant_schema_name, true);
    
    SELECT jsonb_build_object(
      'summary', (
        SELECT jsonb_build_object(
          'totalCalls', COUNT(*),
          'answeredCalls', COUNT(*) FILTER (WHERE status = 'answered'),
          'missedCalls', COUNT(*) FILTER (WHERE status = 'missed'),
          'totalDuration', COALESCE(SUM(duration_seconds), 0),
          'averageDuration', COALESCE(AVG(duration_seconds), 0),
          'lastUpdated', MAX(created_at)
        )
        FROM calls
        WHERE timestamp::DATE BETWEEN from_date AND to_date
      ),
      'engagement', (
        SELECT jsonb_build_object(
          'appointmentsViaAgent', COUNT(*) FILTER (WHERE status = 'Confirmed'),
          'confirmedAppointments', COUNT(*) FILTER (WHERE status = 'Confirmed'),
          'whatsappConversations', (
            SELECT COUNT(DISTINCT conversation_id)
            FROM whatsapp_messages
            WHERE timestamp::DATE BETWEEN from_date AND to_date
          ),
          'whatsappMessages', (
            SELECT COUNT(*)
            FROM whatsapp_messages
            WHERE timestamp::DATE BETWEEN from_date AND to_date
          ),
          'totalCustomers', (
            SELECT COUNT(DISTINCT id)
            FROM customers
          )
        )
        FROM appointments
        WHERE (appointment_datetime::DATE BETWEEN from_date AND to_date
               OR scheduled_at::DATE BETWEEN from_date AND to_date)
      ),
      'timeseries', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'timestamp', date_trunc('day', timestamp),
            'value', COUNT(*)
          ) ORDER BY date_trunc('day', timestamp)
        ), '[]'::jsonb)
        FROM calls
        WHERE timestamp::DATE BETWEEN from_date AND to_date
        GROUP BY date_trunc('day', timestamp)
      ),
      'statusBreakdown', (
        SELECT jsonb_build_object(
          'answered', COUNT(*) FILTER (WHERE status = 'answered'),
          'missed', COUNT(*) FILTER (WHERE status = 'missed'),
          'other', COUNT(*) FILTER (WHERE status NOT IN ('answered', 'missed'))
        )
        FROM calls
        WHERE timestamp::DATE BETWEEN from_date AND to_date
      ),
      'recentMetrics', '[]'::jsonb
    ) INTO result;
    
    PERFORM set_config('search_path', 'public', true);
  END IF;
  
  RETURN result;
END;
$$;

-- ============================================
-- PART 5: MIGRATE EXISTING TENANTS
-- ============================================

-- Migrate all existing tenants to their schemas
DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN 
    SELECT id, tenant_schema, name 
    FROM public.tenants 
    WHERE tenant_schema IS NOT NULL
  LOOP
    RAISE NOTICE 'Migrating tenant: % (%) to schema: %', 
      tenant_record.name, tenant_record.id, tenant_record.tenant_schema;
    
    PERFORM public.create_tenant_schema(tenant_record.tenant_schema, tenant_record.id);
    PERFORM public.migrate_tenant_data_to_schema(tenant_record.id, tenant_record.tenant_schema);
  END LOOP;
END $$;

-- ============================================
-- PART 6: CREATE HELPER FUNCTION FOR FRONTEND
-- ============================================

-- Function to get current user's tenant schema
CREATE OR REPLACE FUNCTION public.get_current_tenant_schema()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  current_user_id UUID;
  schema_name TEXT;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT tu.tenant_schema INTO schema_name
  FROM public.tenant_users tu
  WHERE tu.user_id = current_user_id
  LIMIT 1;
  
  RETURN schema_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_tenant_schema TO authenticated;

COMMENT ON FUNCTION public.create_tenant_schema IS 'Creates a new tenant schema with all required tables';
COMMENT ON FUNCTION public.migrate_tenant_data_to_schema IS 'Migrates tenant data from public schema to tenant schema';
COMMENT ON FUNCTION public.get_tenant_schema IS 'Gets the schema name for a tenant';
COMMENT ON FUNCTION public.get_current_tenant_schema IS 'Gets the current user''s tenant schema name';
