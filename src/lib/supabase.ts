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
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

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
          user_id: string | null;
          customer_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          phone_number: string;
          contact_name?: string | null;
          direction: string;
          status: string;
          duration_seconds: number;
          timestamp: string;
          notes?: string | null;
          agent_id?: string | null;
          user_id?: string | null;
          customer_id?: string | null;
          created_at?: string;
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
        };
      };
      appointments: {
        Row: {
          id: string;
          source: string | null;
          scheduled_at: string | null;
          created_by: string | null;
          call_id: string | null;
          user_id: string | null;
          calendar_event_id: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          source?: string | null;
          scheduled_at?: string | null;
          created_by?: string | null;
          call_id?: string | null;
          user_id?: string | null;
          calendar_event_id?: string | null;
          status: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          source?: string | null;
          scheduled_at?: string | null;
          created_by?: string | null;
          call_id?: string | null;
          user_id?: string | null;
          calendar_event_id?: string | null;
          status?: string;
        };
      };
      engagement_metrics: {
        Row: {
          id: number;
          metric_date: string;
          user_id: string | null;
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
          metadata: Record<string, unknown>;
        };
        Insert: {
          id?: number;
          metric: string;
          timestamp: string;
          value: number;
          user_id?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: {
          id?: number;
          metric?: string;
          timestamp?: string;
          value?: number;
          user_id?: string | null;
          metadata?: Record<string, unknown>;
        };
      };
      status_summary: {
        Row: {
          id: number;
          period: string;
          user_id: string | null;
          answered: number;
          missed: number;
          other: number;
          updated_at: string;
        };
        Insert: {
          id?: number;
          period: string;
          user_id?: string | null;
          answered: number;
          missed: number;
          other: number;
          updated_at?: string;
        };
        Update: {
          id?: number;
          period?: string;
          user_id?: string | null;
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
          timezone: string | null;
          color_id: string | null;
          status: 'confirmed' | 'tentative' | 'cancelled';
          recurrence: string | null;
          attendees: Record<string, unknown>[];
          reminders: Record<string, unknown>[];
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
          synced_at: string;
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
          timezone?: string | null;
          color_id?: string | null;
          status?: 'confirmed' | 'tentative' | 'cancelled';
          recurrence?: string | null;
          attendees?: Record<string, unknown>[];
          reminders?: Record<string, unknown>[];
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
          synced_at?: string;
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
          timezone?: string | null;
          color_id?: string | null;
          status?: 'confirmed' | 'tentative' | 'cancelled';
          recurrence?: string | null;
          attendees?: Record<string, unknown>[];
          reminders?: Record<string, unknown>[];
          metadata?: Record<string, unknown>;
          updated_at?: string;
          synced_at?: string;
        };
      };
      whatsapp_messages: {
        Row: {
          id: string;
          user_id: string | null;
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
    };
  };
}

