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

interface TenantContextType {
  tenant: TenantConfig | null;
  tenantSupabase: SupabaseClient<Database> | null;
  loading: boolean;
  error: string | null;
  switchTenant: (tenantId: string) => Promise<void>;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [tenantSupabase, setTenantSupabase] = useState<SupabaseClient<Database> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTenant = useCallback(async (tenantId?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      // Build query to get user's tenant
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

      if (!tenantUsers || tenantUsers.length === 0) {
        throw new Error('No tenant found for user. Please contact support.');
      }

      // Get the first tenant (or the specified one)
      const tenantUser = tenantUsers[0];
      const tenantData = tenantUser.tenants as any;

      if (!tenantData) {
        throw new Error('Tenant data not found');
      }

      // Build tenant config
      const config: TenantConfig = {
        id: tenantData.id,
        name: tenantData.name,
        subdomain: tenantData.subdomain,
        supabaseUrl: tenantData.supabase_url || import.meta.env.VITE_SUPABASE_URL || '',
        supabaseAnonKey: tenantData.supabase_anon_key || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        n8nWebhookBaseUrl: tenantData.n8n_webhook_base_url || '',
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

      // Create tenant-specific Supabase client
      const tenantClient = createClient<Database>(
        config.supabaseUrl,
        config.supabaseAnonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
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
        await loadTenant(cachedTenantId || undefined);
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
        localStorage.removeItem('current_tenant_id');
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadTenant]);

  const switchTenant = useCallback(async (tenantId: string) => {
    await loadTenant(tenantId);
  }, [loadTenant]);

  const refreshTenant = useCallback(async () => {
    if (tenant?.id) {
      await loadTenant(tenant.id);
    }
  }, [tenant?.id, loadTenant]);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        tenantSupabase,
        loading,
        error,
        switchTenant,
        refreshTenant,
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

