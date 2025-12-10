-- ============================================
-- MIGRATION SCRIPT: SINGLE-TENANT TO MULTI-TENANT
-- Run this AFTER MULTI_TENANT_SCHEMA.sql
-- Creates Spa and Dentist tenants with their n8n workflow URLs
-- ============================================

DO $$
DECLARE
  v_spa_tenant_id UUID;
  v_dentist_tenant_id UUID;
  v_user_id UUID;
  null_count INTEGER;
BEGIN
  -- ============================================
  -- STEP 1: CREATE SPA TENANT
  -- ============================================
  
  -- Check if Spa tenant already exists
  SELECT id INTO v_spa_tenant_id 
  FROM public.tenants 
  WHERE name = 'Spa' 
  LIMIT 1;
  
  -- Create Spa tenant if it doesn't exist
  IF v_spa_tenant_id IS NULL THEN
    INSERT INTO public.tenants (
      name,
      subdomain,
      n8n_webhook_base_url,
      status,
      config
    ) VALUES (
      'Spa',
      'spa',
      'http://localhost:5678/workflow/n39dwyI1GCjXuan8',
      'active',
      jsonb_build_object(
        'migrated', true,
        'migration_date', NOW()::text,
        'type', 'spa',
        'description', 'Spa with massage therapists'
      )
    )
    RETURNING id INTO v_spa_tenant_id;
    
    RAISE NOTICE 'Created Spa tenant with ID: %', v_spa_tenant_id;
  ELSE
    RAISE NOTICE 'Spa tenant already exists with ID: %', v_spa_tenant_id;
  END IF;
  
  -- ============================================
  -- STEP 2: CREATE DENTIST TENANT
  -- ============================================
  
  -- Check if Dentist tenant already exists
  SELECT id INTO v_dentist_tenant_id 
  FROM public.tenants 
  WHERE name = 'Dentist' 
  LIMIT 1;
  
  -- Create Dentist tenant if it doesn't exist
  IF v_dentist_tenant_id IS NULL THEN
    INSERT INTO public.tenants (
      name,
      subdomain,
      n8n_webhook_base_url,
      status,
      config
    ) VALUES (
      'Dentist',
      'dentist',
      'http://localhost:5678/workflow/GtAxaRH2PXmv0uOg',
      'active',
      jsonb_build_object(
        'migrated', true,
        'migration_date', NOW()::text,
        'type', 'dentist',
        'description', 'Dental practice'
      )
    )
    RETURNING id INTO v_dentist_tenant_id;
    
    RAISE NOTICE 'Created Dentist tenant with ID: %', v_dentist_tenant_id;
  ELSE
    RAISE NOTICE 'Dentist tenant already exists with ID: %', v_dentist_tenant_id;
  END IF;
  
  -- ============================================
  -- STEP 3: ASSIGN ALL EXISTING DATA TO TENANTS
  -- Note: You'll need to manually assign users to tenants
  -- Example SQL to assign a user to a tenant:
  -- INSERT INTO public.tenant_users (tenant_id, user_id, role) 
  -- VALUES (v_spa_tenant_id, 'user-uuid-here', 'owner');
  -- ============================================
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'IMPORTANT: You need to manually assign users to tenants';
  RAISE NOTICE 'Example:';
  RAISE NOTICE '  INSERT INTO public.tenant_users (tenant_id, user_id, role)';
  RAISE NOTICE '  VALUES (''%'', ''user-uuid'', ''owner'');', v_spa_tenant_id;
  RAISE NOTICE '============================================';
  
  -- ============================================
  -- STEP 4: ASSIGN EXISTING DATA TO TENANTS
  -- Note: You may need to manually assign data to the correct tenant
  -- For now, we'll leave existing data unassigned (tenant_id = NULL)
  -- You can update them later based on your business logic
  -- ============================================
  
  RAISE NOTICE 'Existing data will remain unassigned. Assign manually as needed.';
  
  -- ============================================
  -- STEP 4: VERIFICATION
  -- ============================================
  
  -- Check for any remaining NULL tenant_ids (should be 0)
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
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION COMPLETE!';
  RAISE NOTICE 'Spa tenant ID: %', v_spa_tenant_id;
  RAISE NOTICE 'Dentist tenant ID: %', v_dentist_tenant_id;
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create users in Supabase Auth';
  RAISE NOTICE '2. Assign users to tenants using tenant_users table';
  RAISE NOTICE '3. For admin users, assign them to multiple tenants with admin role';
  RAISE NOTICE '4. Test authentication and tenant switching';
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

