/**
 * Tenant Context
 * Manages tenant configuration and tenant-specific Supabase client
 * Loads tenant config after user authentication
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, setTenantSupabaseClient } from '@/lib/supabase';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase';

export interface TenantConfig {
  id: string;
  name: string;
  subdomain?: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  n8nWebhookBaseUrl: string;
  n8nApiKey?: string;
  config: Record<string, unknown>;
  status: 'active' | 'suspended' | 'trial' | 'inactive';
}

interface TenantOption {
  id: string;
  name: string;
  role: string;
}

interface TenantContextType {
  tenant: TenantConfig | null;
  tenantSupabase: SupabaseClient<Database> | null;
  loading: boolean;
  error: string | null;
  availableTenants: TenantOption[];
  isAdmin: boolean;
  isOwner: boolean; // True if user has 'owner' role
  userRole: string | null; // Current user's role ('admin', 'owner', etc.)
  tenantName: string | null; // Current tenant's name ('Spa', 'Dentist', etc.)
  switchTenant: (tenantId: string) => Promise<void>;
  refreshTenant: () => Promise<void>;
  loadAvailableTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [tenantSupabase, setTenantSupabase] = useState<SupabaseClient<Database> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTenants, setAvailableTenants] = useState<TenantOption[]>([]);
  const [isAdmin, setIsAdmin] = useState(false); // General admin (can access admin dashboard)
  const [isOwner, setIsOwner] = useState(false); // Tenant owner (cannot access admin dashboard)
  const [userRole, setUserRole] = useState<string | null>(null); // Current user's role
  const [tenantName, setTenantName] = useState<string | null>(null); // Current tenant's name

  const loadTenant = useCallback(async (tenantId?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      // Check if user is admin or owner (by checking tenant_users)
      const { data: userTenantRoles } = await supabase
        .from('tenant_users')
        .select('role')
        .eq('user_id', user.id);

      // Distinguish between admin (general admin) and owner (tenant owner)
      const userIsAdmin = (userTenantRoles && Array.isArray(userTenantRoles) && userTenantRoles.some((tu: { role: string }) => tu.role === 'admin')) || false;
      const userIsOwner = (userTenantRoles && Array.isArray(userTenantRoles) && userTenantRoles.some((tu: { role: string }) => tu.role === 'owner')) || false;
      setIsAdmin(userIsAdmin);
      setIsOwner(userIsOwner);

      let tenantData: any = null;

      // Admin or owner can access any tenant if they have cross-tenant access
      // For now, we allow admin to access any tenant, owner only their assigned tenants
      if (userIsAdmin && tenantId) {
        // Admin can access any tenant - fetch directly from tenants table
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', tenantId)
          .eq('status', 'active')
          .single();

        if (tenantError) {
          throw new Error(`Failed to load tenant: ${tenantError.message}`);
        }

        if (!tenant) {
          throw new Error('Tenant not found or inactive.');
        }

        tenantData = tenant;
        // Admin role for admin users
        setUserRole('admin');
      } else {
        // Regular user or admin loading first tenant - use tenant_users
        let query = supabase
          .from('tenant_users')
          .select('tenant_id, role, tenants(*)')
          .eq('user_id', user.id);

        // If tenantId provided, filter by it
        if (tenantId) {
          query = query.eq('tenant_id', tenantId);
        }

        const { data: tenantUsers, error: tenantError } = await query;

        if (tenantError) {
          throw new Error(`Failed to load tenant: ${tenantError.message}`);
        }

        if (!tenantUsers || !Array.isArray(tenantUsers) || tenantUsers.length === 0) {
          throw new Error('No tenant found for user. Please contact support.');
        }

        // Type assertion for tenant_users query result
        type TenantUserResult = {
          tenant_id: string;
          role: string;
          tenants: any;
        };

        const typedTenantUsers = tenantUsers as TenantUserResult[];

        // Get the first tenant (or the specified one)
        const tenantUser = tenantId 
          ? typedTenantUsers.find((tu: TenantUserResult) => tu.tenant_id === tenantId) || typedTenantUsers[0]
          : typedTenantUsers[0];
        
        if (!tenantUser) {
          throw new Error('No tenant found for user. Please contact support.');
        }
        
        tenantData = tenantUser.tenants as any;
        
        // Set user role for this tenant
        setUserRole(tenantUser.role || null);
      }

      if (!tenantData) {
        throw new Error('Tenant data not found');
      }
      
      // Set tenant name
      setTenantName(tenantData.name || null);

      // Build tenant config
      const config: TenantConfig = {
        id: tenantData.id,
        name: tenantData.name,
        subdomain: tenantData.subdomain,
        supabaseUrl: tenantData.supabase_url || import.meta.env.VITE_SUPABASE_URL || '',
        supabaseAnonKey: tenantData.supabase_anon_key || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        n8nWebhookBaseUrl: tenantData.n8n_webhook_base_url || '', // Will be converted via getN8nWebhookUrl() when used
        n8nApiKey: tenantData.n8n_api_key,
        config: tenantData.config || {},
        status: tenantData.status || 'active',
      };

      // Validate required fields
      if (!config.supabaseUrl || !config.supabaseAnonKey) {
        throw new Error('Tenant Supabase configuration is incomplete');
      }

      if (!config.n8nWebhookBaseUrl) {
        console.warn('[TenantContext] n8n webhook base URL not configured for tenant');
      }

      setTenant(config);

      // Reuse the base Supabase client instead of creating a new one
      // This prevents "Multiple GoTrueClient instances detected" warning
      // The base client already handles authentication, and RLS policies handle tenant isolation
      // Only create a tenant-specific client if the URLs/keys are different
      let tenantClient: SupabaseClient<Database>;
      
      if (config.supabaseUrl === import.meta.env.VITE_SUPABASE_URL && 
          config.supabaseAnonKey === import.meta.env.VITE_SUPABASE_ANON_KEY) {
        // Same Supabase instance - reuse base client
        tenantClient = supabase;
      } else {
        // Different Supabase instance - create new client with unique storage key
        tenantClient = createClient<Database>(
          config.supabaseUrl,
          config.supabaseAnonKey,
          {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
              storageKey: `tenant-${config.id}-auth-token`, // Unique storage key per tenant
            },
            global: {
              headers: {
                'X-Tenant-ID': config.id,
              },
            },
          }
        );

        // Set the auth session from the main client to the tenant client
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await tenantClient.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
        }
      }

      // Note: RLS policies use get_user_tenant_id() function which queries tenant_users table
      // This is more reliable than JWT claims and works with Supabase's standard auth flow

      setTenantSupabase(tenantClient);
      setTenantSupabaseClient(tenantClient); // ✅ Register with supabase.ts for getTenantSupabase()

      // Store tenant ID in localStorage for quick access
      localStorage.setItem('current_tenant_id', config.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tenant';
      setError(errorMessage);
      console.error('[TenantContext] Error loading tenant:', err);
      
      // Clear tenant on error
      setTenant(null);
      setTenantSupabase(null);
      setTenantSupabaseClient(null); // ✅ Clear tenant client
      setUserRole(null);
      setTenantName(null);
      localStorage.removeItem('current_tenant_id');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if user is authenticated before loading tenant
    const checkAuthAndLoadTenant = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Try to load tenant from localStorage first (for faster initial load)
        const cachedTenantId = localStorage.getItem('current_tenant_id');
        try {
        await loadTenant(cachedTenantId || undefined);
        } catch (err) {
          // If cached tenant ID fails, clear it and try without cache
          console.warn('[TenantContext] Cached tenant ID failed, clearing cache and retrying...');
          localStorage.removeItem('current_tenant_id');
          await loadTenant();
        }
      } else {
        setLoading(false);
      }
    };

    checkAuthAndLoadTenant();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await loadTenant();
      } else if (event === 'SIGNED_OUT') {
        setTenant(null);
        setTenantSupabase(null);
      setTenantSupabaseClient(null); // ✅ Clear tenant client on sign out
      setUserRole(null);
      setTenantName(null);
      localStorage.removeItem('current_tenant_id');
      // Reset dashboard store on sign out
      if (typeof window !== 'undefined') {
        import('@/store/useDashboardStore').then(({ useDashboardStore }) => {
          useDashboardStore.getState().reset();
        });
      }
      setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadTenant]);

  const switchTenant = useCallback(async (tenantId: string) => {
    // Owners cannot switch tenants - block the action
    if (isOwner) {
      console.warn('[TenantContext] Owners cannot switch tenants');
      return;
    }
    
    // Only admins can switch tenants
    if (!isAdmin) {
      console.warn('[TenantContext] Only admins can switch tenants');
      return;
    }
    
    // Reset dashboard store when switching tenants to avoid showing stale data
    if (typeof window !== 'undefined') {
      const { useDashboardStore } = await import('@/store/useDashboardStore');
      useDashboardStore.getState().reset();
    }
    
    await loadTenant(tenantId);
  }, [loadTenant, isAdmin, isOwner]);

  const refreshTenant = useCallback(async () => {
    if (tenant?.id) {
      // Reset dashboard store when refreshing tenant to avoid showing stale data
      if (typeof window !== 'undefined') {
        const { useDashboardStore } = await import('@/store/useDashboardStore');
        useDashboardStore.getState().reset();
      }
      await loadTenant(tenant.id);
    }
  }, [tenant?.id, loadTenant]);

  const loadAvailableTenants = useCallback(async () => {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return;
      }

      // Get all tenant memberships for the user
      const { data: tenantUsers, error: tenantError } = await supabase
        .from('tenant_users')
        .select('tenant_id, role, tenants(id, name)')
        .eq('user_id', user.id);

      if (tenantError) {
        console.error('[TenantContext] Error loading available tenants:', tenantError);
        return;
      }

      // Type assertion for tenant_users query result
      type TenantUserWithTenant = {
        tenant_id: string;
        role: string;
        tenants: {
          id: string;
          name: string;
        } | null;
      };

      const typedTenantUsers = (tenantUsers as TenantUserWithTenant[]) || [];

      // Check if user is admin (has admin role) or owner (has owner role)
      const userIsAdmin = typedTenantUsers.some((tu: TenantUserWithTenant) => tu.role === 'admin');
      const userIsOwner = typedTenantUsers.some((tu: TenantUserWithTenant) => tu.role === 'owner');
      setIsAdmin(userIsAdmin || false);
      setIsOwner(userIsOwner || false);

      if (userIsAdmin) {
        // Admin can see ALL tenants - fetch all active tenants
        const { data: allTenants, error: allTenantsError } = await supabase
          .from('tenants')
          .select('id, name')
          .eq('status', 'active')
          .order('name', { ascending: true });

        if (!allTenantsError && allTenants) {
          // Map all tenants, preserving role if user is assigned to that tenant
          const allTenantOptions: TenantOption[] = allTenants.map((t: { id: string; name: string }) => {
            const userTenant = typedTenantUsers.find((tu: TenantUserWithTenant) => tu.tenant_id === t.id);
            return {
              id: t.id,
              name: t.name,
              role: userTenant?.role || 'admin', // Admin role for all tenants they can access
            };
          });
          setAvailableTenants(allTenantOptions);
        } else if (allTenantsError) {
          console.error('[TenantContext] Error loading all tenants for admin:', allTenantsError);
          // Fallback to user's assigned tenants
          if (typedTenantUsers.length > 0) {
            const tenants: TenantOption[] = typedTenantUsers.map((tu: TenantUserWithTenant) => ({
              id: tu.tenant_id,
              name: tu.tenants?.name || 'Unknown',
              role: tu.role,
            }));
            setAvailableTenants(tenants);
          }
        }
      } else {
        // Regular user - only show their assigned tenants
        if (typedTenantUsers.length > 0) {
          const tenants: TenantOption[] = typedTenantUsers.map((tu: TenantUserWithTenant) => ({
            id: tu.tenant_id,
            name: tu.tenants?.name || 'Unknown',
            role: tu.role,
          }));
          setAvailableTenants(tenants);
        }
      }
    } catch (err) {
      console.error('[TenantContext] Error loading available tenants:', err);
    }
  }, []);

  // Load available tenants when user is authenticated
  useEffect(() => {
    const checkAuthAndLoadTenants = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await loadAvailableTenants();
      }
    };

    checkAuthAndLoadTenants();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await loadAvailableTenants();
      } else if (event === 'SIGNED_OUT') {
        setAvailableTenants([]);
        setIsAdmin(false);
        setIsOwner(false);
        setUserRole(null);
        setTenantName(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadAvailableTenants]);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        tenantSupabase,
        loading,
        error,
        availableTenants,
        isAdmin,
        isOwner,
        userRole,
        tenantName,
        switchTenant,
        refreshTenant,
        loadAvailableTenants,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}

