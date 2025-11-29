/**
 * Protected Route Component
 * Wraps routes that require authentication and tenant membership
 */

import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireTenant?: boolean; // If true, requires tenant to be loaded
}

export function ProtectedRoute({ children, requireTenant = true }: ProtectedRouteProps) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const { tenant, loading: tenantLoading, error: tenantError } = useTenant();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    setAuthenticated(!!user);
  }

  // Show loading state while checking auth and loading tenant
  if (authenticated === null || (requireTenant && tenantLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show error if tenant is required but not loaded
  if (requireTenant && !tenant) {
    if (tenantError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Tenant Error</h2>
            <p className="text-gray-700 mb-4">{tenantError}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">No Tenant Found</h2>
          <p className="text-gray-700 mb-4">
            Your account is not associated with any tenant. Please contact support.
          </p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}
            className="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Check if tenant is suspended
  if (requireTenant && tenant && tenant.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-yellow-600 mb-4">Tenant Suspended</h2>
          <p className="text-gray-700 mb-4">
            Your tenant account is currently {tenant.status}. Please contact support to reactivate.
          </p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}
            className="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}

