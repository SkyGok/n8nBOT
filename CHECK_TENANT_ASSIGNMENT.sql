-- Quick check: Is admin@example.com assigned to a tenant?

-- Check if user exists in auth.users
SELECT 
  'auth.users' as source,
  id,
  email,
  confirmed_at
FROM auth.users
WHERE email = 'admin@example.com';

-- Check if user exists in public.users
SELECT 
  'public.users' as source,
  id,
  email
FROM public.users
WHERE email = 'admin@example.com';

-- Check tenant assignments for admin@example.com
SELECT 
  t.name as tenant_name,
  u.email,
  tu.role,
  tu.created_at as assigned_at
FROM public.tenant_users tu
JOIN public.tenants t ON tu.tenant_id = t.id
JOIN public.users u ON tu.user_id = u.id
WHERE u.email = 'admin@example.com';

-- If no results above, run this to assign admin to a tenant:
-- (Make sure you've run SETUP_USERS_AND_TENANTS.sql first)

-- Assign admin to Spa tenant (for admin role detection)
INSERT INTO public.tenant_users (tenant_id, user_id, role)
SELECT 
  (SELECT id FROM public.tenants WHERE name = 'Spa' LIMIT 1),
  (SELECT id FROM auth.users WHERE email = 'admin@example.com'),
  'admin'
ON CONFLICT (tenant_id, user_id) DO UPDATE
SET role = EXCLUDED.role;
