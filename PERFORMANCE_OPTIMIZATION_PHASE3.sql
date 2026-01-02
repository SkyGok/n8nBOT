-- ============================================
-- PHASE 3: REDIS CACHING LAYER
-- 50-100ms Dashboard Loads
-- ============================================

-- ============================================
-- PART 1: CREATE CACHE INVALIDATION TRIGGERS
-- ============================================

-- Function to notify cache invalidation (for Redis pub/sub or webhook)
CREATE OR REPLACE FUNCTION public.notify_cache_invalidation(
  cache_key_pattern TEXT,
  tenant_schema_name TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function can be extended to:
  -- 1. Send Redis pub/sub message
  -- 2. Call webhook to invalidate cache
  -- 3. Update cache_version table for version-based invalidation
  
  -- For now, we'll use a cache_version table approach
  -- Increment cache version to invalidate all cached data for a pattern
  
  INSERT INTO public.cache_versions (cache_key_pattern, tenant_schema, version, updated_at)
  VALUES (cache_key_pattern, tenant_schema_name, 1, NOW())
  ON CONFLICT (cache_key_pattern, tenant_schema) 
  DO UPDATE SET 
    version = cache_versions.version + 1,
    updated_at = NOW();
    
  -- Optionally: Send NOTIFY for PostgreSQL LISTEN/NOTIFY
  PERFORM pg_notify('cache_invalidation', json_build_object(
    'pattern', cache_key_pattern,
    'tenant_schema', tenant_schema_name,
    'timestamp', NOW()
  )::text);
END;
$$;

-- ============================================
-- PART 2: CREATE CACHE VERSION TABLE
-- ============================================

-- Table to track cache versions for invalidation
CREATE TABLE IF NOT EXISTS public.cache_versions (
  id BIGSERIAL PRIMARY KEY,
  cache_key_pattern TEXT NOT NULL,
  tenant_schema TEXT,
  version BIGINT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (cache_key_pattern, tenant_schema)
);

CREATE INDEX IF NOT EXISTS idx_cache_versions_pattern ON public.cache_versions(cache_key_pattern, tenant_schema);

-- ============================================
-- PART 3: UPDATE TRIGGERS TO INVALIDATE CACHE
-- ============================================

-- Enhanced trigger function that invalidates cache on data changes
-- PHASE 2 COMPATIBLE: Works with schema-per-tenant architecture
CREATE OR REPLACE FUNCTION public.update_daily_metrics_and_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  affected_date DATE;
  affected_tenant_id UUID;
  tenant_schema_name TEXT;
BEGIN
  -- PHASE 2: Get schema from trigger context (TG_TABLE_SCHEMA)
  -- TG_TABLE_SCHEMA contains the schema name of the table that fired the trigger
  tenant_schema_name := TG_TABLE_SCHEMA;
  
  -- If we're in a tenant schema (not public), get tenant_id from schema name
  IF tenant_schema_name LIKE 'tenant_%' THEN
    -- Extract tenant_id from schema name by looking up in tenants table
    SELECT id INTO affected_tenant_id
    FROM public.tenants
    WHERE tenant_schema = tenant_schema_name
    LIMIT 1;
  ELSE
    -- Fallback: Try to get tenant_id from row (for public tables with tenant_id)
    IF TG_TABLE_NAME = 'calls' THEN
      affected_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
    ELSIF TG_TABLE_NAME = 'appointments' THEN
      affected_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
    ELSIF TG_TABLE_NAME = 'whatsapp_messages' THEN
      affected_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
    ELSIF TG_TABLE_NAME = 'customers' THEN
      affected_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
    END IF;
    
    -- Get tenant schema name from tenant_id
    IF affected_tenant_id IS NOT NULL THEN
      SELECT tenant_schema INTO tenant_schema_name
      FROM public.tenants
      WHERE id = affected_tenant_id;
    END IF;
  END IF;

  -- Determine the affected date from the changed row
  IF TG_TABLE_NAME = 'calls' THEN
    affected_date := (COALESCE(NEW.timestamp, OLD.timestamp))::DATE;
  ELSIF TG_TABLE_NAME = 'appointments' THEN
    affected_date := COALESCE(
      (NEW.appointment_datetime::DATE),
      (NEW.scheduled_at::DATE),
      (OLD.appointment_datetime::DATE),
      (OLD.scheduled_at::DATE)
    );
  ELSIF TG_TABLE_NAME = 'whatsapp_messages' THEN
    affected_date := (COALESCE(NEW.timestamp, OLD.timestamp))::DATE;
  ELSIF TG_TABLE_NAME = 'customers' THEN
    affected_date := (COALESCE(NEW.created_at, OLD.created_at))::DATE;
  ELSE
    RETURN NULL;
  END IF;

  -- Re-aggregate metrics for the affected date (Phase 1)
  -- Note: aggregate_daily_metrics needs tenant_id, but in Phase 2 we use schema
  -- So we need to get tenant_id from schema if we have it
  IF affected_date IS NOT NULL AND affected_tenant_id IS NOT NULL THEN
    PERFORM public.aggregate_daily_metrics(affected_date, affected_tenant_id);
  END IF;

  -- Invalidate cache (Phase 3)
  IF tenant_schema_name IS NOT NULL THEN
    -- Invalidate dashboard cache
    PERFORM public.notify_cache_invalidation('dashboard:*', tenant_schema_name);
    -- Invalidate daily metrics cache for affected date
    PERFORM public.notify_cache_invalidation(
      format('daily_metrics:%s:%s', tenant_schema_name, affected_date),
      tenant_schema_name
    );
  END IF;

  RETURN NULL;
END;
$$;

-- Update existing triggers to use new function (if Phase 1 triggers exist)
-- PHASE 2 COMPATIBLE: Also create triggers on tenant schema tables
DO $$
DECLARE
  tenant_record RECORD;
  schema_name TEXT;
BEGIN
  -- Update triggers on public tables (for backward compatibility)
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_metrics_on_calls_change'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_update_metrics_on_calls_change ON public.calls;
    CREATE TRIGGER trigger_update_metrics_on_calls_change
      AFTER INSERT OR UPDATE OR DELETE ON public.calls
      FOR EACH ROW
      EXECUTE FUNCTION public.update_daily_metrics_and_cache();
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_metrics_on_appointments_change'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_update_metrics_on_appointments_change ON public.appointments;
    CREATE TRIGGER trigger_update_metrics_on_appointments_change
      AFTER INSERT OR UPDATE OR DELETE ON public.appointments
      FOR EACH ROW
      EXECUTE FUNCTION public.update_daily_metrics_and_cache();
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_metrics_on_whatsapp_change'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_update_metrics_on_whatsapp_change ON public.whatsapp_messages;
    CREATE TRIGGER trigger_update_metrics_on_whatsapp_change
      AFTER INSERT OR UPDATE OR DELETE ON public.whatsapp_messages
      FOR EACH ROW
      EXECUTE FUNCTION public.update_daily_metrics_and_cache();
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_metrics_on_customers_change'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_update_metrics_on_customers_change ON public.customers;
    CREATE TRIGGER trigger_update_metrics_on_customers_change
      AFTER INSERT OR UPDATE OR DELETE ON public.customers
      FOR EACH ROW
      EXECUTE FUNCTION public.update_daily_metrics_and_cache();
  END IF;

  -- PHASE 2: Create triggers on all tenant schema tables
  FOR tenant_record IN 
    SELECT tenant_schema FROM public.tenants WHERE tenant_schema IS NOT NULL
  LOOP
    schema_name := tenant_record.tenant_schema;
    
    -- Create triggers on tenant schema tables
    EXECUTE format('
      DROP TRIGGER IF EXISTS trigger_update_metrics_on_calls_change ON %I.calls;
      CREATE TRIGGER trigger_update_metrics_on_calls_change
        AFTER INSERT OR UPDATE OR DELETE ON %I.calls
        FOR EACH ROW
        EXECUTE FUNCTION public.update_daily_metrics_and_cache();
    ', schema_name, schema_name);
    
    EXECUTE format('
      DROP TRIGGER IF EXISTS trigger_update_metrics_on_appointments_change ON %I.appointments;
      CREATE TRIGGER trigger_update_metrics_on_appointments_change
        AFTER INSERT OR UPDATE OR DELETE ON %I.appointments
        FOR EACH ROW
        EXECUTE FUNCTION public.update_daily_metrics_and_cache();
    ', schema_name, schema_name);
    
    EXECUTE format('
      DROP TRIGGER IF EXISTS trigger_update_metrics_on_whatsapp_change ON %I.whatsapp_messages;
      CREATE TRIGGER trigger_update_metrics_on_whatsapp_change
        AFTER INSERT OR UPDATE OR DELETE ON %I.whatsapp_messages
        FOR EACH ROW
        EXECUTE FUNCTION public.update_daily_metrics_and_cache();
    ', schema_name, schema_name);
    
    EXECUTE format('
      DROP TRIGGER IF EXISTS trigger_update_metrics_on_customers_change ON %I.customers;
      CREATE TRIGGER trigger_update_metrics_on_customers_change
        AFTER INSERT OR UPDATE OR DELETE ON %I.customers
        FOR EACH ROW
        EXECUTE FUNCTION public.update_daily_metrics_and_cache();
    ', schema_name, schema_name);
  END LOOP;
END $$;

-- ============================================
-- PART 4: CREATE CACHE-AWARE RPC FUNCTIONS
-- ============================================

-- Function to get cache version (for cache key generation)
CREATE OR REPLACE FUNCTION public.get_cache_version(
  cache_key_pattern TEXT,
  tenant_schema_name TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  cache_version BIGINT;
BEGIN
  SELECT version INTO cache_version
  FROM public.cache_versions
  WHERE cache_key_pattern = get_cache_version.cache_key_pattern
    AND (tenant_schema = tenant_schema_name OR (tenant_schema IS NULL AND tenant_schema_name IS NULL))
  ORDER BY updated_at DESC
  LIMIT 1;
  
  RETURN COALESCE(cache_version, 1);
END;
$$;

-- Drop old get_dashboard_overview function (from Phase 2) if it exists
DROP FUNCTION IF EXISTS public.get_dashboard_overview(DATE, DATE);

-- Updated get_dashboard_overview with cache version
CREATE OR REPLACE FUNCTION public.get_dashboard_overview(
  from_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  to_date DATE DEFAULT CURRENT_DATE,
  cache_version BIGINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  tenant_schema_name TEXT;
  result JSONB;
  current_cache_version BIGINT;
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
  
  -- Get current cache version
  current_cache_version := public.get_cache_version('dashboard:*', tenant_schema_name);
  
  -- If cache_version provided and matches, return cached indicator
  -- (Actual caching happens in application layer with Redis)
  -- This function just provides the cache version for key generation
  
  -- Set search path to tenant schema
  PERFORM set_config('search_path', tenant_schema_name, true);
  
  -- Build dashboard response using tenant schema
  SELECT jsonb_build_object(
    'cache_version', current_cache_version,
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
      'cache_version', current_cache_version,
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.notify_cache_invalidation TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_cache_version TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_overview TO authenticated;

COMMENT ON TABLE public.cache_versions IS 'Tracks cache versions for invalidation';
COMMENT ON FUNCTION public.notify_cache_invalidation IS 'Notifies cache invalidation when data changes';
COMMENT ON FUNCTION public.get_cache_version IS 'Gets current cache version for a cache key pattern';
