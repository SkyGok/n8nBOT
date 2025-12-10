-- ============================================
-- SETUP USERS AND TENANT ASSIGNMENTS
-- This script syncs users from auth.users to public.users
-- and assigns them to tenants
-- ============================================

-- Step 1: Sync all users from auth.users to public.users
-- This will create users in public.users if they don't exist
INSERT INTO public.users (id, email, full_name, created_at)
SELECT 
  id,
  email,
  COALESCE(
    raw_user_meta_data->>'full_name',
    split_part(email, '@', 1)  -- Use email prefix as name if no full_name
  ) as full_name,
  created_at
FROM auth.users
WHERE email IN ('spa@example.com', 'dentist@example.com', 'admin@example.com')
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, public.users.full_name);

-- Step 2: Assign spa@example.com to Spa tenant as owner
INSERT INTO public.tenant_users (tenant_id, user_id, role)
SELECT 
  (SELECT id FROM public.tenants WHERE name = 'Spa'),
  (SELECT id FROM auth.users WHERE email = 'spa@example.com'),
  'owner'
ON CONFLICT (tenant_id, user_id) DO UPDATE
SET role = EXCLUDED.role;

-- Step 3: Assign dentist@example.com to Dentist tenant as owner
INSERT INTO public.tenant_users (tenant_id, user_id, role)
SELECT 
  (SELECT id FROM public.tenants WHERE name = 'Dentist'),
  (SELECT id FROM auth.users WHERE email = 'dentist@example.com'),
  'owner'
ON CONFLICT (tenant_id, user_id) DO UPDATE
SET role = EXCLUDED.role;

-- Step 4: Assign admin@example.com to at least ONE tenant as admin (for admin role detection)
-- Admin doesn't need to be in all tenants - they can access all via RLS policies
-- But we assign them to one tenant so the system recognizes them as admin
-- Admin will see ALL tenants in the dropdown, not just assigned ones
INSERT INTO public.tenant_users (tenant_id, user_id, role)
SELECT 
  (SELECT id FROM public.tenants WHERE name = 'Spa' LIMIT 1),
  (SELECT id FROM auth.users WHERE email = 'admin@example.com'),
  'admin'
ON CONFLICT (tenant_id, user_id) DO UPDATE
SET role = EXCLUDED.role;

-- Note: Admin can access ALL tenants via RLS policies (user_is_admin() function)
-- They don't need to be explicitly assigned to each tenant
-- The TenantContext will fetch all tenants for admin users

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if users exist in auth.users
SELECT 
  'auth.users' as source,
  id,
  email,
  created_at,
  confirmed_at
FROM auth.users
WHERE email IN ('spa@example.com', 'dentist@example.com', 'admin@example.com')
ORDER BY email;

-- Check if users exist in public.users
SELECT 
  'public.users' as source,
  id,
  email,
  full_name,
  created_at
FROM public.users
WHERE email IN ('spa@example.com', 'dentist@example.com', 'admin@example.com')
ORDER BY email;

-- Check tenant assignments
SELECT 
  t.name as tenant_name,
  u.email,
  tu.role,
  tu.created_at as assigned_at
FROM public.tenant_users tu
JOIN public.tenants t ON tu.tenant_id = t.id
JOIN public.users u ON tu.user_id = u.id
WHERE u.email IN ('spa@example.com', 'dentist@example.com', 'admin@example.com')
ORDER BY t.name, u.email;

-- ============================================
-- IMPORTANT: If users don't exist in auth.users yet
-- ============================================
-- You need to create them in Supabase Dashboard first:
-- 1. Go to Authentication → Users → Add User
-- 2. Create each user with their email and password
-- 3. Then run this script to sync them to public.users and assign to tenants

-- OR use Supabase Admin API to create users programmatically
-- (This requires service role key, not recommended for production)
