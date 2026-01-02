-- ============================================
-- PHASE 1: PERFORMANCE OPTIMIZATION
-- Make It FAST: Pre-aggregation + Single RPC
-- ============================================

-- ============================================
-- PART 1: CREATE DAILY METRICS TABLE
-- ============================================

-- Pre-aggregated daily metrics table
CREATE TABLE IF NOT EXISTS public.daily_metrics (
  tenant_id UUID NOT NULL,
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
  PRIMARY KEY (tenant_id, day),
  CONSTRAINT daily_metrics_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_daily_metrics_tenant_day ON public.daily_metrics(tenant_id, day DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_day ON public.daily_metrics(day DESC);

-- Enable RLS
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their tenant's metrics
CREATE POLICY "Users can view their tenant's daily metrics" ON public.daily_metrics
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
  );

-- ============================================
-- PART 2: CREATE DASHBOARD OVERVIEW RPC
-- ============================================

-- Single RPC function that returns all dashboard data in one call
CREATE OR REPLACE FUNCTION public.get_dashboard_overview(
  from_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  to_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_tenant_id UUID;
  result JSONB;
BEGIN
  -- Get tenant_id from JWT
  current_tenant_id := (auth.jwt() ->> 'tenant_id')::UUID;
  
  IF current_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant_id found in JWT';
  END IF;

  -- Build comprehensive dashboard response
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
      FROM public.daily_metrics
      WHERE tenant_id = current_tenant_id
        AND day BETWEEN from_date AND to_date
    ),
    'engagement', (
      SELECT jsonb_build_object(
        'appointmentsViaAgent', COALESCE(SUM(total_appointments), 0),
        'confirmedAppointments', COALESCE(SUM(confirmed_appointments), 0),
        'whatsappConversations', COALESCE(SUM(whatsapp_conversations), 0),
        'whatsappMessages', COALESCE(SUM(whatsapp_messages), 0),
        'totalCustomers', COALESCE(MAX(total_customers), 0)
      )
      FROM public.daily_metrics
      WHERE tenant_id = current_tenant_id
        AND day BETWEEN from_date AND to_date
    ),
    'timeseries', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'timestamp', day,
          'value', total_calls
        ) ORDER BY day
      )
      FROM public.daily_metrics
      WHERE tenant_id = current_tenant_id
        AND day BETWEEN from_date AND to_date
    ),
    'statusBreakdown', (
      SELECT jsonb_build_object(
        'answered', COALESCE(SUM(answered_calls), 0),
        'missed', COALESCE(SUM(missed_calls), 0),
        'other', COALESCE(SUM(total_calls) - SUM(answered_calls) - SUM(missed_calls), 0)
      )
      FROM public.daily_metrics
      WHERE tenant_id = current_tenant_id
        AND day BETWEEN from_date AND to_date
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
        FROM public.daily_metrics
        WHERE tenant_id = current_tenant_id
          AND day BETWEEN from_date AND to_date
        ORDER BY day DESC
        LIMIT 30
      ) recent_data
    )
  ) INTO result;

  -- If no metrics exist, calculate from raw data (fallback)
  IF result->'summary'->>'totalCalls' = '0' OR result->'summary'->>'totalCalls' IS NULL THEN
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
        FROM public.calls
        WHERE tenant_id = current_tenant_id
          AND timestamp::DATE BETWEEN from_date AND to_date
      ),
      'engagement', (
        SELECT jsonb_build_object(
          'appointmentsViaAgent', COUNT(*) FILTER (WHERE status = 'Confirmed'),
          'confirmedAppointments', COUNT(*) FILTER (WHERE status = 'Confirmed'),
          'whatsappConversations', (
            SELECT COUNT(DISTINCT conversation_id)
            FROM public.whatsapp_messages
            WHERE tenant_id = current_tenant_id
              AND timestamp::DATE BETWEEN from_date AND to_date
          ),
          'whatsappMessages', (
            SELECT COUNT(*)
            FROM public.whatsapp_messages
            WHERE tenant_id = current_tenant_id
              AND timestamp::DATE BETWEEN from_date AND to_date
          ),
          'totalCustomers', (
            SELECT COUNT(DISTINCT id)
            FROM public.customers
            WHERE tenant_id = current_tenant_id
          )
        )
        FROM public.appointments
        WHERE tenant_id = current_tenant_id
          AND (appointment_datetime::DATE BETWEEN from_date AND to_date
               OR scheduled_at::DATE BETWEEN from_date AND to_date)
      ),
      'timeseries', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'timestamp', date_trunc('day', timestamp),
            'value', COUNT(*)
          ) ORDER BY date_trunc('day', timestamp)
        )
        FROM public.calls
        WHERE tenant_id = current_tenant_id
          AND timestamp::DATE BETWEEN from_date AND to_date
        GROUP BY date_trunc('day', timestamp)
      ),
      'statusBreakdown', (
        SELECT jsonb_build_object(
          'answered', COUNT(*) FILTER (WHERE status = 'answered'),
          'missed', COUNT(*) FILTER (WHERE status = 'missed'),
          'other', COUNT(*) FILTER (WHERE status NOT IN ('answered', 'missed'))
        )
        FROM public.calls
        WHERE tenant_id = current_tenant_id
          AND timestamp::DATE BETWEEN from_date AND to_date
      ),
      'recentMetrics', '[]'::jsonb
    ) INTO result;
  END IF;

  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_dashboard_overview TO authenticated;

-- ============================================
-- PART 3: CREATE METRICS AGGREGATION FUNCTION
-- ============================================

-- Function to aggregate metrics for a specific day
CREATE OR REPLACE FUNCTION public.aggregate_daily_metrics(
  target_date DATE DEFAULT CURRENT_DATE,
  target_tenant_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- If tenant_id not provided, aggregate for all tenants
  IF target_tenant_id IS NULL THEN
    FOR tenant_uuid IN SELECT id FROM public.tenants LOOP
      PERFORM public.aggregate_daily_metrics(target_date, tenant_uuid);
    END LOOP;
    RETURN;
  END IF;

  -- Upsert daily metrics for the tenant and date
  INSERT INTO public.daily_metrics (
    tenant_id,
    day,
    total_calls,
    answered_calls,
    missed_calls,
    total_duration_seconds,
    avg_duration_seconds,
    total_appointments,
    confirmed_appointments,
    whatsapp_messages,
    whatsapp_conversations,
    total_customers,
    new_customers,
    revenue,
    updated_at
  )
  SELECT
    target_tenant_id,
    target_date,
    -- Calls metrics
    COUNT(DISTINCT c.id) FILTER (WHERE c.id IS NOT NULL),
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'answered'),
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'missed'),
    COALESCE(SUM(c.duration_seconds), 0),
    COALESCE(AVG(c.duration_seconds), 0),
    -- Appointments metrics
    COUNT(DISTINCT a.id) FILTER (WHERE a.id IS NOT NULL),
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'Confirmed'),
    -- WhatsApp metrics
    COUNT(DISTINCT w.id) FILTER (WHERE w.id IS NOT NULL),
    COUNT(DISTINCT w.conversation_id) FILTER (WHERE w.id IS NOT NULL),
    -- Customer metrics
    (SELECT COUNT(DISTINCT id) FROM public.customers WHERE tenant_id = target_tenant_id),
    COUNT(DISTINCT cust.id) FILTER (WHERE cust.created_at::DATE = target_date),
    -- Revenue (placeholder - add your revenue calculation)
    0,
    NOW()
  FROM (SELECT target_tenant_id AS tenant_id) t
  LEFT JOIN public.calls c ON c.tenant_id = t.tenant_id 
    AND c.timestamp::DATE = target_date
  LEFT JOIN public.appointments a ON a.tenant_id = t.tenant_id
    AND (a.appointment_datetime::DATE = target_date OR a.scheduled_at::DATE = target_date)
  LEFT JOIN public.whatsapp_messages w ON w.tenant_id = t.tenant_id
    AND w.timestamp::DATE = target_date
  LEFT JOIN public.customers cust ON cust.tenant_id = t.tenant_id
  ON CONFLICT (tenant_id, day) 
  DO UPDATE SET
    total_calls = EXCLUDED.total_calls,
    answered_calls = EXCLUDED.answered_calls,
    missed_calls = EXCLUDED.missed_calls,
    total_duration_seconds = EXCLUDED.total_duration_seconds,
    avg_duration_seconds = EXCLUDED.avg_duration_seconds,
    total_appointments = EXCLUDED.total_appointments,
    confirmed_appointments = EXCLUDED.confirmed_appointments,
    whatsapp_messages = EXCLUDED.whatsapp_messages,
    whatsapp_conversations = EXCLUDED.whatsapp_conversations,
    total_customers = EXCLUDED.total_customers,
    new_customers = EXCLUDED.new_customers,
    revenue = EXCLUDED.revenue,
    updated_at = NOW();
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.aggregate_daily_metrics TO authenticated, service_role;

-- ============================================
-- PART 4: CREATE TRIGGERS FOR AUTO-UPDATE
-- ============================================

-- Function to update metrics when data changes
CREATE OR REPLACE FUNCTION public.update_daily_metrics_on_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  affected_date DATE;
  affected_tenant_id UUID;
BEGIN
  -- Determine the date and tenant_id from the changed row
  IF TG_TABLE_NAME = 'calls' THEN
    affected_date := (COALESCE(NEW.timestamp, OLD.timestamp))::DATE;
    affected_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
  ELSIF TG_TABLE_NAME = 'appointments' THEN
    affected_date := COALESCE(
      (NEW.appointment_datetime::DATE),
      (NEW.scheduled_at::DATE),
      (OLD.appointment_datetime::DATE),
      (OLD.scheduled_at::DATE)
    );
    affected_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
  ELSIF TG_TABLE_NAME = 'whatsapp_messages' THEN
    affected_date := (COALESCE(NEW.timestamp, OLD.timestamp))::DATE;
    affected_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
  ELSIF TG_TABLE_NAME = 'customers' THEN
    affected_date := (COALESCE(NEW.created_at, OLD.created_at))::DATE;
    affected_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
  ELSE
    RETURN NULL;
  END IF;

  -- Re-aggregate metrics for the affected date
  IF affected_date IS NOT NULL AND affected_tenant_id IS NOT NULL THEN
    PERFORM public.aggregate_daily_metrics(affected_date, affected_tenant_id);
  END IF;

  RETURN NULL;
END;
$$;

-- Create triggers on relevant tables
DROP TRIGGER IF EXISTS trigger_update_metrics_on_calls_change ON public.calls;
CREATE TRIGGER trigger_update_metrics_on_calls_change
  AFTER INSERT OR UPDATE OR DELETE ON public.calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_daily_metrics_on_change();

DROP TRIGGER IF EXISTS trigger_update_metrics_on_appointments_change ON public.appointments;
CREATE TRIGGER trigger_update_metrics_on_appointments_change
  AFTER INSERT OR UPDATE OR DELETE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_daily_metrics_on_change();

DROP TRIGGER IF EXISTS trigger_update_metrics_on_whatsapp_change ON public.whatsapp_messages;
CREATE TRIGGER trigger_update_metrics_on_whatsapp_change
  AFTER INSERT OR UPDATE OR DELETE ON public.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_daily_metrics_on_change();

DROP TRIGGER IF EXISTS trigger_update_metrics_on_customers_change ON public.customers;
CREATE TRIGGER trigger_update_metrics_on_customers_change
  AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_daily_metrics_on_change();

-- ============================================
-- PART 5: INITIAL DATA BACKFILL
-- ============================================

-- Backfill metrics for the last 90 days for all tenants
DO $$
DECLARE
  tenant_record RECORD;
  day_offset INTEGER;
  target_date DATE;
BEGIN
  FOR tenant_record IN SELECT id FROM public.tenants LOOP
    FOR day_offset IN 0..89 LOOP
      target_date := (CURRENT_DATE - day_offset)::DATE;
      PERFORM public.aggregate_daily_metrics(
        target_date,
        tenant_record.id
      );
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- PART 6: CREATE CRON JOB (for pg_cron extension)
-- ============================================

-- Note: This requires pg_cron extension to be enabled
-- Run this manually if pg_cron is available:
-- SELECT cron.schedule('aggregate-daily-metrics', '0 1 * * *', 'SELECT public.aggregate_daily_metrics(CURRENT_DATE - INTERVAL ''1 day'');');

COMMENT ON TABLE public.daily_metrics IS 'Pre-aggregated daily metrics for fast dashboard queries';
COMMENT ON FUNCTION public.get_dashboard_overview IS 'Single RPC call that returns all dashboard data in one round trip';
COMMENT ON FUNCTION public.aggregate_daily_metrics IS 'Aggregates raw data into daily_metrics table for a specific date and tenant';
