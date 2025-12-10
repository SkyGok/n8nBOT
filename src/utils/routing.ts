/**
 * Routing utilities for role-based dashboard routing
 */

export type UserRole = 'admin' | 'owner' | 'member' | string;
export type TenantName = 'Spa' | 'Dentist' | string;

/**
 * Get the dashboard route based on user role and tenant name
 * @param role - User role from tenant_users table ('admin', 'owner', etc.)
 * @param tenantName - Name of the tenant (e.g., 'Spa', 'Dentist')
 * @returns The dashboard route path
 */
export function getDashboardRouteByRole(role: UserRole, tenantName?: TenantName): string {
  // Admin users go to admin dashboard
  if (role === 'admin') {
    return '/admin';
  }

  // Owner or other roles go to their tenant-specific dashboard
  // Map tenant name to route (case-insensitive)
  if (tenantName) {
    const normalizedTenantName = tenantName.toLowerCase().trim();
    
    if (normalizedTenantName === 'spa') {
      return '/spa';
    }
    
    if (normalizedTenantName === 'dentist') {
      return '/dentist';
    }
    
    // For other tenant names, use the tenant name as the route
    // Convert to lowercase and replace spaces with hyphens
    return `/${normalizedTenantName.replace(/\s+/g, '-')}`;
  }

  // Fallback: if no tenant name, go to root (will redirect)
  return '/';
}

/**
 * Check if a user can access a specific route based on their role and tenant
 * @param route - The route path to check
 * @param role - User role
 * @param tenantName - Tenant name
 * @param isOwner - Whether user is an owner (for strict access control)
 * @returns true if user can access the route
 */
export function canAccessRoute(route: string, role: UserRole, tenantName?: TenantName, isOwner: boolean = false): boolean {
  // Admin can access admin routes
  if (route === '/admin') {
    return role === 'admin';
  }

  // Tenant-specific routes
  if (route === '/spa') {
    // Owners can ONLY access their own tenant
    if (isOwner) {
      return tenantName?.toLowerCase() === 'spa';
    }
    return tenantName?.toLowerCase() === 'spa' || role === 'admin';
  }

  if (route === '/dentist') {
    // Owners can ONLY access their own tenant
    if (isOwner) {
      return tenantName?.toLowerCase() === 'dentist';
    }
    return tenantName?.toLowerCase() === 'dentist' || role === 'admin';
  }

  // Admin can access all routes
  if (role === 'admin') {
    return true;
  }

  // Owners: strict tenant matching for tenant-specific routes
  if (isOwner && tenantName) {
    const normalizedTenantName = tenantName.toLowerCase().trim().replace(/\s+/g, '-');
    const tenantRoute = `/${normalizedTenantName}`;
    
    // Block other tenant routes
    if (route === tenantRoute) {
      return true;
    }
    
    // Allow common routes (analytics, calls, whatsapp, calendar, settings)
    if (route.startsWith('/analytics') || 
        route.startsWith('/calls') || 
        route.startsWith('/whatsapp') || 
        route === '/calendar' || 
        route === '/settings') {
      return true;
    }
    
    // Block everything else
    return false;
  }

  // For other roles, check if it matches the tenant
  if (tenantName) {
    const normalizedTenantName = tenantName.toLowerCase().trim().replace(/\s+/g, '-');
    return route === `/${normalizedTenantName}`;
  }

  // Default: allow access to common routes (analytics, calls, etc.)
  return true;
}
