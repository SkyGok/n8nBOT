/**
 * Tenant Route Component
 * Protects routes that are specific to a tenant (e.g., /spa, /dentist)
 * Only users belonging to that tenant (or admins) can access
 */

import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import { getDashboardRouteByRole } from '@/utils/routing';

interface TenantRouteProps {
  children: React.ReactNode;
  requiredTenantName: string; // e.g., 'Spa', 'Dentist'
}

export function TenantRoute({ children, requiredTenantName }: TenantRouteProps) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [canAccess, setCanAccess] = useState<boolean | null>(null);
  const { tenantName, userRole, loading: tenantLoading, isAdmin, isOwner } = useTenant();
  const location = useLocation();

  useEffect(() => {
    checkAuthAndAccess();
  }, [tenantName, userRole, isAdmin, isOwner, tenantLoading]);

  async function checkAuthAndAccess() {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    setAuthenticated(!!user);

    if (!user) {
      setCanAccess(false);
      return;
    }

    // Wait for tenant to load
    if (tenantLoading || !tenantName || !userRole) {
      return;
    }

    // Check if user can access this tenant route
    const normalizedRequired = requiredTenantName.toLowerCase().trim();
    const normalizedTenant = tenantName.toLowerCase().trim();
    
    // Admin can access all tenant routes
    if (isAdmin) {
      setCanAccess(true);
      return;
    }

    // Owners can ONLY access their own tenant - strict check
    if (isOwner) {
      const hasAccess = normalizedTenant === normalizedRequired;
      setCanAccess(hasAccess);
      return;
    }

    // Other roles must belong to this tenant
    const hasAccess = normalizedTenant === normalizedRequired;
    setCanAccess(hasAccess);
  }

  // Show loading state while checking auth and access
  if (authenticated === null || canAccess === null || tenantLoading) {
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

  // Redirect to correct dashboard if user doesn't have access to this tenant
  if (!canAccess && userRole && tenantName) {
    const correctRoute = getDashboardRouteByRole(userRole, tenantName);
    return <Navigate to={correctRoute} replace />;
  }

  // All checks passed, render children
  return <>{children}</>;
}
