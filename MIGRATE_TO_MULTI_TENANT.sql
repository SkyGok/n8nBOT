-- ============================================
-- MIGRATION SCRIPT: SINGLE-TENANT TO MULTI-TENANT
-- Run this AFTER MULTI_TENANT_SCHEMA.sql
-- Assigns all existing data to a default tenant
-- ============================================

DO $$
DECLARE
  v_default_tenant_id UUID;
  v_user_id UUID;
BEGIN
  -- ============================================
  -- STEP 1: CREATE DEFAULT TENANT
  -- ============================================
  
  -- Check if default tenant already exists
  SELECT id INTO v_default_tenant_id 
  FROM public.tenants 
  WHERE name = 'Default Tenant' 
  LIMIT 1;
  
  -- Create default tenant if it doesn't exist
  IF v_default_tenant_id IS NULL THEN
    INSERT INTO public.tenants (
      name,
      subdomain,
      n8n_webhook_base_url,
      status,
      config
    ) VALUES (
      'Default Tenant',
      'default',
      COALESCE(
        (SELECT n8n_webhook_base_url FROM public.tenants LIMIT 1),
        'https://n8n.example.com/webhook/default'
      ),
      'active',
      '{"migrated": true, "migration_date": "' || NOW()::text || '"}'::jsonb
    )
    RETURNING id INTO v_default_tenant_id;
    
    RAISE NOTICE 'Created default tenant with ID: %', v_default_tenant_id;
  ELSE
    RAISE NOTICE 'Default tenant already exists with ID: %', v_default_tenant_id;
  END IF;
  
  -- ============================================
  -- STEP 2: ASSIGN ALL EXISTING USERS TO DEFAULT TENANT
  -- ============================================
  
  -- Loop through all users and assign them to default tenant
  FOR v_user_id IN 
    SELECT id FROM public.users
    WHERE id NOT IN (
      SELECT user_id FROM public.tenant_users WHERE tenant_id = v_default_tenant_id
    )
  LOOP
    INSERT INTO public.tenant_users (
      tenant_id,
      user_id,
      role
    ) VALUES (
      v_default_tenant_id,
      v_user_id,
      'owner' -- Make all existing users owners of default tenant
    )
    ON CONFLICT (tenant_id, user_id) DO NOTHING;
    
    RAISE NOTICE 'Assigned user % to default tenant', v_user_id;
  END LOOP;
  
  -- ============================================
  -- STEP 3: ASSIGN ALL EXISTING DATA TO DEFAULT TENANT
  -- ============================================
  
  -- Update calls table
  UPDATE public.calls
  SET tenant_id = v_default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Assigned % calls to default tenant', (SELECT COUNT(*) FROM public.calls WHERE tenant_id = v_default_tenant_id);
  
  -- Update appointments table
  UPDATE public.appointments
  SET tenant_id = v_default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Assigned % appointments to default tenant', (SELECT COUNT(*) FROM public.appointments WHERE tenant_id = v_default_tenant_id);
  
  -- Update calendar_events table
  UPDATE public.calendar_events
  SET tenant_id = v_default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Assigned % calendar events to default tenant', (SELECT COUNT(*) FROM public.calendar_events WHERE tenant_id = v_default_tenant_id);
  
  -- Update customers table
  UPDATE public.customers
  SET tenant_id = v_default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Assigned % customers to default tenant', (SELECT COUNT(*) FROM public.customers WHERE tenant_id = v_default_tenant_id);
  
  -- Update whatsapp_messages table
  UPDATE public.whatsapp_messages
  SET tenant_id = v_default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Assigned % WhatsApp messages to default tenant', (SELECT COUNT(*) FROM public.whatsapp_messages WHERE tenant_id = v_default_tenant_id);
  
  -- Update engagement_metrics table
  UPDATE public.engagement_metrics
  SET tenant_id = v_default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Assigned % engagement metrics to default tenant', (SELECT COUNT(*) FROM public.engagement_metrics WHERE tenant_id = v_default_tenant_id);
  
  -- Update timeseries table
  UPDATE public.timeseries
  SET tenant_id = v_default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Assigned % timeseries records to default tenant', (SELECT COUNT(*) FROM public.timeseries WHERE tenant_id = v_default_tenant_id);
  
  -- Update status_summary table
  UPDATE public.status_summary
  SET tenant_id = v_default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Assigned % status summary records to default tenant', (SELECT COUNT(*) FROM public.status_summary WHERE tenant_id = v_default_tenant_id);
  
  -- ============================================
  -- STEP 4: VERIFICATION
  -- ============================================
  
  -- Check for any remaining NULL tenant_ids (should be 0)
  DO $$
  DECLARE
    null_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO null_count
    FROM (
      SELECT tenant_id FROM public.calls WHERE tenant_id IS NULL
      UNION ALL
      SELECT tenant_id FROM public.appointments WHERE tenant_id IS NULL
      UNION ALL
      SELECT tenant_id FROM public.calendar_events WHERE tenant_id IS NULL
      UNION ALL
      SELECT tenant_id FROM public.customers WHERE tenant_id IS NULL
      UNION ALL
      SELECT tenant_id FROM public.whatsapp_messages WHERE tenant_id IS NULL
      UNION ALL
      SELECT tenant_id FROM public.engagement_metrics WHERE tenant_id IS NULL
      UNION ALL
      SELECT tenant_id FROM public.timeseries WHERE tenant_id IS NULL
      UNION ALL
      SELECT tenant_id FROM public.status_summary WHERE tenant_id IS NULL
    ) AS all_nulls;
    
    IF null_count > 0 THEN
      RAISE WARNING 'Found % records with NULL tenant_id. These need to be assigned manually.', null_count;
    ELSE
      RAISE NOTICE '✓ All records have been assigned to a tenant. Migration complete!';
    END IF;
  END $$;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION COMPLETE!';
  RAISE NOTICE 'Default tenant ID: %', v_default_tenant_id;
  RAISE NOTICE 'All existing data has been assigned to the default tenant.';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update frontend to use TenantContext';
  RAISE NOTICE '2. Test authentication and tenant loading';
  RAISE NOTICE '3. Create additional tenants as needed';
  RAISE NOTICE '============================================';
  
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check tenant assignment
SELECT 
  'Tenants' AS table_name,
  COUNT(*) AS total_count
FROM public.tenants
UNION ALL
SELECT 
  'Tenant Users' AS table_name,
  COUNT(*) AS total_count
FROM public.tenant_users
UNION ALL
SELECT 
  'Calls with tenant_id' AS table_name,
  COUNT(*) AS total_count
FROM public.calls
WHERE tenant_id IS NOT NULL
UNION ALL
SELECT 
  'Appointments with tenant_id' AS table_name,
  COUNT(*) AS total_count
FROM public.appointments
WHERE tenant_id IS NOT NULL
UNION ALL
SELECT 
  'Calendar Events with tenant_id' AS table_name,
  COUNT(*) AS total_count
FROM public.calendar_events
WHERE tenant_id IS NOT NULL
UNION ALL
SELECT 
  'Customers with tenant_id' AS table_name,
  COUNT(*) AS total_count
FROM public.customers
WHERE tenant_id IS NOT NULL;

-- Check for any NULL tenant_ids (should return 0 rows)
SELECT 
  'calls' AS table_name,
  COUNT(*) AS null_tenant_count
FROM public.calls
WHERE tenant_id IS NULL
UNION ALL
SELECT 
  'appointments' AS table_name,
  COUNT(*) AS null_tenant_count
FROM public.appointments
WHERE tenant_id IS NULL
UNION ALL
SELECT 
  'calendar_events' AS table_name,
  COUNT(*) AS null_tenant_count
FROM public.calendar_events
WHERE tenant_id IS NULL
UNION ALL
SELECT 
  'customers' AS table_name,
  COUNT(*) AS null_tenant_count
FROM public.customers
WHERE tenant_id IS NULL
UNION ALL
SELECT 
  'whatsapp_messages' AS table_name,
  COUNT(*) AS null_tenant_count
FROM public.whatsapp_messages
WHERE tenant_id IS NULL
UNION ALL
SELECT 
  'engagement_metrics' AS table_name,
  COUNT(*) AS null_tenant_count
FROM public.engagement_metrics
WHERE tenant_id IS NULL
UNION ALL
SELECT 
  'timeseries' AS table_name,
  COUNT(*) AS null_tenant_count
FROM public.timeseries
WHERE tenant_id IS NULL
UNION ALL
SELECT 
  'status_summary' AS table_name,
  COUNT(*) AS null_tenant_count
FROM public.status_summary
WHERE tenant_id IS NULL;

