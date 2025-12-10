/**
 * Dashboard Redirect Component
 * Redirects /dashboard to the correct role-based dashboard
 */

import { Navigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { getDashboardRouteByRole } from '@/utils/routing';

export function DashboardRedirect() {
  const { userRole, tenantName, loading } = useTenant();

  // Show loading while determining role
  if (loading || !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to the correct dashboard based on role
  const dashboardRoute = getDashboardRouteByRole(userRole, tenantName || undefined);
  return <Navigate to={dashboardRoute} replace />;
}
