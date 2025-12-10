/**
 * Admin Route Component
 * Wraps routes that require admin role (not owner or other roles)
 * Only users with 'admin' role can access these routes
 */

import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const { loading: tenantLoading } = useTenant();
  const location = useLocation();

  useEffect(() => {
    checkAuthAndRole();
  }, []);

  async function checkAuthAndRole() {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    setAuthenticated(!!user);

    if (!user) {
      setIsAdmin(false);
      return;
    }

    // Check if user has 'admin' role (not 'owner' or other roles)
    const { data: userTenantRoles, error } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('user_id', user.id);

    if (error) {
      console.error('[AdminRoute] Error checking user role:', error);
      setIsAdmin(false);
      return;
    }

    // Type assertion for tenant_users query result
    type TenantUserRole = {
      role: string;
    };

    const typedRoles = (userTenantRoles as TenantUserRole[]) || [];

    // User must have 'admin' role (not 'owner')
    const userIsAdmin = typedRoles.some((tu: TenantUserRole) => tu.role === 'admin');
    setIsAdmin(userIsAdmin);
  }

  // Show loading state while checking auth and role
  if (authenticated === null || isAdmin === null || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to dashboard if not admin (owner or other roles)
  // This handles both direct URL access and navigation attempts
  if (!isAdmin) {
    // Redirect non-admin users to their dashboard
    return <Navigate to="/" replace />;
  }

  // All checks passed, render children
  return <>{children}</>;
}
