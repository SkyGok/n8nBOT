/**
 * Supabase client configuration
 * Initialize Supabase client with environment variables
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only throw error if Supabase is explicitly enabled but credentials are missing
const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true';

// Debug logging (only in development or if explicitly enabled)
if (import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true') {
  console.log('[Supabase Config]', {
    hasUrl: !!supabaseUrl,
    urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'missing',
    hasKey: !!supabaseAnonKey,
    keyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'missing',
    useSupabase,
    currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'server',
  });
}

if (useSupabase && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('Supabase is enabled but credentials are missing. Falling back to mock data.');
}

// Create Supabase client with fallback to placeholder if not configured
// This is the base client used for authentication and tenant management
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true, // ✅ Enable session persistence for multi-tenant
      autoRefreshToken: true, // ✅ Enable token refresh
      detectSessionInUrl: true,
    },
  }
);

// Expose supabase to window for debugging (development only)
if (typeof window !== 'undefined' && (import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true')) {
  (window as any).__SUPABASE__ = supabase;
  (window as any).__SUPABASE_URL__ = supabaseUrl;
  (window as any).__SUPABASE_KEY__ = supabaseAnonKey;
  console.log('[Supabase] Exposed to window.__SUPABASE__ for debugging');
}

// Tenant-specific Supabase client (set by TenantContext)
let tenantSupabaseClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Set the tenant-specific Supabase client
 * Called by TenantContext after loading tenant configuration
 */
export function setTenantSupabaseClient(client: ReturnType<typeof createClient<Database>> | null) {
  tenantSupabaseClient = client;
}

/**
 * Get the tenant-specific Supabase client
 * Use this in all data service functions to ensure tenant isolation
 * 
 * PHASE 2: Now uses schema-per-tenant architecture
 * - Dashboard queries use RPC functions that automatically set search_path to tenant schema
 * - Other queries can continue using current approach (RLS still works as fallback)
 * - RPC functions handle schema switching internally
 * 
 * @throws Error if tenant client is not initialized
 */
export function getTenantSupabase(): ReturnType<typeof createClient<Database>> {
  if (!tenantSupabaseClient) {
    throw new Error(
      'Tenant Supabase client not initialized. ' +
      'User must be authenticated and have a tenant. ' +
      'Make sure TenantProvider is set up and user is logged in.'
    );
  }
  return tenantSupabaseClient;
}

// Database types matching your Supabase schema
export interface Database {
  public: {
    Tables: {
      calls: {
        Row: {
          id: string;
          phone_number: string;
          contact_name: string | null;
          direction: string;
          status: string;
          duration_seconds: number;
          timestamp: string;
          notes: string | null;
          agent_id: string | null;
          created_at: string;
          user_id: string | null;
          customer_id: string | null;
          call_type: 'inbound' | 'outbound';
          tenant_id: string;
        };
        Insert: {
          id?: string;
          phone_number: string;
          contact_name?: string | null;
          direction: string;
          status: string;
          duration_seconds?: number;
          timestamp: string;
          notes?: string | null;
          agent_id?: string | null;
          created_at?: string;
          user_id?: string | null;
          customer_id?: string | null;
          call_type: 'inbound' | 'outbound';
          tenant_id?: string; // Auto-set from JWT if not provided
        };
        Update: {
          id?: string;
          phone_number?: string;
          contact_name?: string | null;
          direction?: string;
          status?: string;
          duration_seconds?: number;
          timestamp?: string;
          notes?: string | null;
          agent_id?: string | null;
          user_id?: string | null;
          customer_id?: string | null;
          call_type?: 'inbound' | 'outbound';
          tenant_id?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          source: string | null;
          scheduled_at: string | null;
          created_by: string | null;
          call_id: string | null;
          status: string;
          created_at: string;
          user_id: string | null;
          calendar_event_id: string | null;
          metadata: Record<string, unknown>;
          updated_at: string;
          tenant_id: string;
          // AI Agent direct columns
          appointment_datetime: string | null;
          client_name: string | null;
          client_email: string | null;
          client_phone: string | null;
          service_type: string | null;
          therapist_name: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          source?: string | null;
          scheduled_at?: string | null;
          created_by?: string | null;
          call_id?: string | null;
          status?: string;
          created_at?: string;
          user_id?: string | null;
          calendar_event_id?: string | null;
          metadata?: Record<string, unknown>;
          updated_at?: string;
          tenant_id?: string; // Auto-set from JWT if not provided
          // AI Agent direct columns
          appointment_datetime?: string | null;
          client_name?: string | null;
          client_email?: string | null;
          client_phone?: string | null;
          service_type?: string | null;
          therapist_name?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          source?: string | null;
          scheduled_at?: string | null;
          created_by?: string | null;
          call_id?: string | null;
          status?: string;
          user_id?: string | null;
          calendar_event_id?: string | null;
          metadata?: Record<string, unknown>;
          updated_at?: string;
          tenant_id?: string;
          // AI Agent direct columns
          appointment_datetime?: string | null;
          client_name?: string | null;
          client_email?: string | null;
          client_phone?: string | null;
          service_type?: string | null;
          therapist_name?: string | null;
          notes?: string | null;
        };
      };
      engagement_metrics: {
        Row: {
          id: number;
          metric_date: string;
          user_id: string | null;
          tenant_id: string;
          appointments_via_agent: number;
          whatsapp_conversations: number;
          whatsapp_appointments: number;
          notes_count_today: number;
          last_updated: string;
        };
        Insert: {
          id?: number;
          metric_date: string;
          user_id?: string | null;
          tenant_id?: string; // Auto-set from JWT if not provided
          appointments_via_agent: number;
          whatsapp_conversations: number;
          whatsapp_appointments: number;
          notes_count_today: number;
          last_updated?: string;
        };
        Update: {
          id?: number;
          metric_date?: string;
          user_id?: string | null;
          tenant_id?: string;
          appointments_via_agent?: number;
          whatsapp_conversations?: number;
          whatsapp_appointments?: number;
          notes_count_today?: number;
          last_updated?: string;
        };
      };
      timeseries: {
        Row: {
          id: number;
          metric: string;
          timestamp: string;
          value: number;
          user_id: string | null;
          tenant_id: string;
          metadata: Record<string, unknown>;
        };
        Insert: {
          id?: number;
          metric: string;
          timestamp: string;
          value: number;
          user_id?: string | null;
          tenant_id?: string; // Auto-set from JWT if not provided
          metadata?: Record<string, unknown>;
        };
        Update: {
          id?: number;
          metric?: string;
          timestamp?: string;
          value?: number;
          user_id?: string | null;
          tenant_id?: string;
          metadata?: Record<string, unknown>;
        };
      };
      status_summary: {
        Row: {
          id: number;
          period: string;
          user_id: string | null;
          tenant_id: string;
          answered: number;
          missed: number;
          other: number;
          updated_at: string;
        };
        Insert: {
          id?: number;
          period: string;
          user_id?: string | null;
          tenant_id?: string; // Auto-set from JWT if not provided
          answered: number;
          missed: number;
          other: number;
          updated_at?: string;
        };
        Update: {
          id?: number;
          period?: string;
          user_id?: string | null;
          tenant_id?: string;
          answered?: number;
          missed?: number;
          other?: number;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          role?: string | null;
          created_at?: string;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          google_event_id: string;
          user_id: string | null;
          title: string;
          description: string | null;
          location: string | null;
          start_time: string;
          end_time: string;
          all_day: boolean;
          timezone: string;
          color_id: string | null;
          status: 'confirmed' | 'tentative' | 'cancelled';
          recurrence: string | null;
          attendees: Record<string, unknown>[];
          reminders: Record<string, unknown>[];
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
          synced_at: string;
          appointment_id: string | null;
        };
        Insert: {
          id?: string;
          google_event_id: string;
          user_id?: string | null;
          title: string;
          description?: string | null;
          location?: string | null;
          start_time: string;
          end_time: string;
          all_day?: boolean;
          timezone?: string;
          color_id?: string | null;
          status?: 'confirmed' | 'tentative' | 'cancelled';
          recurrence?: string | null;
          attendees?: Record<string, unknown>[];
          reminders?: Record<string, unknown>[];
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
          synced_at?: string;
          appointment_id?: string | null;
        };
        Update: {
          id?: string;
          google_event_id?: string;
          user_id?: string | null;
          title?: string;
          description?: string | null;
          location?: string | null;
          start_time?: string;
          end_time?: string;
          all_day?: boolean;
          timezone?: string;
          color_id?: string | null;
          status?: 'confirmed' | 'tentative' | 'cancelled';
          recurrence?: string | null;
          attendees?: Record<string, unknown>[];
          reminders?: Record<string, unknown>[];
          metadata?: Record<string, unknown>;
          updated_at?: string;
          synced_at?: string;
          appointment_id?: string | null;
        };
      };
      whatsapp_messages: {
        Row: {
          id: string;
          user_id: string | null;
          tenant_id: string;
          conversation_id: string;
          message_id: string;
          phone_number: string;
          contact_name: string | null;
          direction: 'inbound' | 'outbound';
          message_type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker';
          content: string | null;
          media_url: string | null;
          media_mime_type: string | null;
          timestamp: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          read_at: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          tenant_id?: string; // Auto-set from JWT if not provided
          conversation_id: string;
          message_id: string;
          phone_number: string;
          contact_name?: string | null;
          direction: 'inbound' | 'outbound';
          message_type?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker';
          content?: string | null;
          media_url?: string | null;
          media_mime_type?: string | null;
          timestamp: string;
          status?: 'sent' | 'delivered' | 'read' | 'failed';
          read_at?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          tenant_id?: string;
          conversation_id?: string;
          message_id?: string;
          phone_number?: string;
          contact_name?: string | null;
          direction?: 'inbound' | 'outbound';
          message_type?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker';
          content?: string | null;
          media_url?: string | null;
          media_mime_type?: string | null;
          timestamp?: string;
          status?: 'sent' | 'delivered' | 'read' | 'failed';
          read_at?: string | null;
          metadata?: Record<string, unknown>;
        };
      };
      customers: {
        Row: {
          id: string;
          user_id: string | null;
          tenant_id: string;
          phone_number: string;
          email: string | null;
          full_name: string | null;
          company: string | null;
          notes: string | null;
          tags: string[] | null;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          tenant_id?: string; // Auto-set from JWT if not provided
          phone_number: string;
          email?: string | null;
          full_name?: string | null;
          company?: string | null;
          notes?: string | null;
          tags?: string[] | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          tenant_id?: string;
          phone_number?: string;
          email?: string | null;
          full_name?: string | null;
          company?: string | null;
          notes?: string | null;
          tags?: string[] | null;
          metadata?: Record<string, unknown>;
          updated_at?: string;
        };
      };
      therapists: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          full_name: string;
          name: string;
          email: string | null;
          phone: string | null;
          status: 'Aktif' | 'Pasif';
          working_days: string[] | null;
          working_hours_start: string | null;
          working_hours_end: string | null;
          break_start: string | null;
          break_end: string | null;
          working_hours: string | null;
          break_times: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          tenant_id: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          status?: 'Aktif' | 'Pasif';
          working_days?: string[] | null;
          working_hours_start?: string | null;
          working_hours_end?: string | null;
          break_start?: string | null;
          break_end?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          tenant_id?: string; // Auto-set from JWT if not provided
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          status?: 'Aktif' | 'Pasif';
          working_days?: string[] | null;
          working_hours_start?: string | null;
          working_hours_end?: string | null;
          break_start?: string | null;
          break_end?: string | null;
          notes?: string | null;
          updated_at?: string;
          tenant_id?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          target_quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          target_quantity: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          target_quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_sessions: {
        Row: {
          id: string;
          project_id: string;
          manufacturing_type: string;
          started_at: string;
          paused_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          manufacturing_type: string;
          started_at?: string;
          paused_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          manufacturing_type?: string;
          started_at?: string;
          paused_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      production_updates: {
        Row: {
          id: string;
          project_id: string;
          session_id: string | null;
          quantity_completed: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          session_id?: string | null;
          quantity_completed: number;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          session_id?: string | null;
          quantity_completed?: number;
          note?: string | null;
          created_at?: string;
        };
      };
      workers: {
        Row: {
          id: string;
          name: string;
          role: string | null;
          assigned_station: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          role?: string | null;
          assigned_station?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          role?: string | null;
          assigned_station?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      vehicle_inventory: {
        Row: {
          id: string;
          tenant_id: string;
          vin: string;
          make: string;
          model: string;
          year: number;
          status: 'Available' | 'Sold' | 'Reserved' | 'In Service' | 'Pending';
          price: number;
          features: string | null;
          test_drive_available: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          metadata: Record<string, unknown>;
        };
        Insert: {
          id?: string;
          tenant_id?: string; // Auto-set from JWT if not provided
          vin: string;
          make: string;
          model: string;
          year: number;
          status?: 'Available' | 'Sold' | 'Reserved' | 'In Service' | 'Pending';
          price: number;
          features?: string | null;
          test_drive_available?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          vin?: string;
          make?: string;
          model?: string;
          year?: number;
          status?: 'Available' | 'Sold' | 'Reserved' | 'In Service' | 'Pending';
          price?: number;
          features?: string | null;
          test_drive_available?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          metadata?: Record<string, unknown>;
        };
      };
    };
  };
}

